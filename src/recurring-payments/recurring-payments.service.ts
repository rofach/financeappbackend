import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PaymentFrequency } from './enums/payment-frequency.enum';
import { CreateRecurringPaymentsDto } from './dto/create-recurring-payments.dto';
import { UpdateRecurringPaymentsDto } from './dto/update-recurring-payments.dto';
import { RecurringPaymentsRepository } from './infrastructure/persistence/recurring-payments.repository';
import { RecurringPayments } from './domain/recurring-payments';
import { AccountsService } from '../accounts/accounts.service';
import { CategoriesService } from '../categories/categories.service';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { BudgetsService } from '../budgets/budgets.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RecurringPaymentsService {
  private readonly logger = new Logger(RecurringPaymentsService.name);

  constructor(
    private readonly recurringPaymentsRepository: RecurringPaymentsRepository,
    private readonly accountsService: AccountsService,
    private readonly categoriesService: CategoriesService,
    private readonly transactionsService: TransactionsService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly budgetsService: BudgetsService,
  ) {}

  async create(createDto: CreateRecurringPaymentsDto, userId: string) {
    const account = await this.accountsService.findOne(
      userId,
      createDto.accountId,
    );
    if (!account) throw new NotFoundException('Account not found');

    const category = await this.categoriesService.findOne(
      createDto.categoryId,
      userId,
    );
    if (!category) throw new NotFoundException('Category not found');

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const beginDate = new Date(createDto.beginDate);

    const payment = new RecurringPayments();
    payment.user = user;
    payment.account = account;
    payment.category = category;
    payment.type = createDto.type;
    payment.amount = createDto.amount;
    payment.frequency = createDto.frequency;
    payment.beginDate = beginDate;
    payment.nextExecuteDate = beginDate;
    payment.isActive = true;

    const savedPayment = await this.recurringPaymentsRepository.create(payment);

    if (user.email) {
      await this.mailService
        .recurringPaymentCreated({
          to: user.email,
          data: {
            amount: savedPayment.amount,
            frequency: savedPayment.frequency,
            nextDate: savedPayment.nextExecuteDate
              ? savedPayment.nextExecuteDate.toISOString()
              : 'Pending',
          },
        })
        .catch((e) =>
          this.logger.error(`Failed to send creation email: ${e.message}`),
        );
    }

    return savedPayment;
  }

  async findAll() {
    return await this.recurringPaymentsRepository.findAllWithPagination({
      paginationOptions: { page: 1, limit: 100 },
    });
  }

  async findById(id: RecurringPayments['id']) {
    return await this.recurringPaymentsRepository.findById(id);
  }

  async update(
    id: RecurringPayments['id'],
    updateDto: UpdateRecurringPaymentsDto,
    userId: string,
  ) {
    const payment = await this.findById(id);
    if (!payment || payment.user.id !== userId)
      throw new NotFoundException('Payment not found');

    const payload: Partial<RecurringPayments> = {};
    if (updateDto.isActive !== undefined) payload.isActive = updateDto.isActive;
    if (updateDto.amount !== undefined) payload.amount = updateDto.amount;
    if (updateDto.type !== undefined) payload.type = updateDto.type;

    if (updateDto.categoryId) {
      const category = await this.categoriesService.findOne(
        updateDto.categoryId,
        userId,
      );
      if (category) payload.category = category;
    }

    return await this.recurringPaymentsRepository.update(id, payload);
  }

  async remove(id: RecurringPayments['id'], userId: string) {
    const payment = await this.findById(id);
    if (!payment || payment.user.id !== userId)
      throw new NotFoundException('Payment not found');
    return await this.recurringPaymentsRepository.remove(id);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processPayments() {
    this.logger.log('Running recurring payments processor...');
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const duePayments =
      await this.recurringPaymentsRepository.findDuePayments(today);
    this.logger.log(`Found ${duePayments.length} due payments to process`);

    for (const payment of duePayments) {
      try {
        const userId = String(payment.user.id);
        const oldAccount = await this.accountsService.findOne(
          userId,
          payment.account.id,
        );
        const oldBudgets = await this.budgetsService.findByCategoryId(
          userId,
          payment.category.id,
        );
        const oldBalance = oldAccount ? Number(oldAccount.balance) : 0;

        await this.transactionsService.create(
          {
            accountId: payment.account.id,
            categoryId: payment.category.id,
            amount: payment.amount,
            type: payment.type,
            date: payment.nextExecuteDate
              ? payment.nextExecuteDate.toISOString()
              : new Date().toISOString(),
            note: 'Automated recurring payment',
          },
          payment.user,
        );

        const nextDate = this.calculateNextExecutionDate(
          payment.nextExecuteDate || new Date(),
          payment.frequency,
        );

        await this.recurringPaymentsRepository.update(payment.id, {
          nextExecuteDate: nextDate,
        });

        // Send processing email
        if (payment.user.email) {
          await this.mailService
            .recurringPaymentProcessed({
              to: payment.user.email,
              data: {
                accountName: payment.account.name,
                amount: payment.amount,
              },
            })
            .catch((e) =>
              this.logger.error(
                `Failed to send processing email: ${e.message}`,
              ),
            );
        }

        // Check balances and budgets
        const newAccount = await this.accountsService.findOne(
          userId,
          payment.account.id,
        );
        if (newAccount) {
          const newBalance = Number(newAccount.balance);
          if (oldBalance >= 0 && newBalance < 0 && payment.user.email) {
            await this.mailService
              .balanceNegativeWarning({
                to: payment.user.email,
                data: {
                  accountName: newAccount.name,
                  balance: newBalance,
                },
              })
              .catch((e) =>
                this.logger.error(
                  `Failed to send negative balance email: ${e.message}`,
                ),
              );
          }
        }

        const newBudgets = await this.budgetsService.findByCategoryId(
          userId,
          payment.category.id,
        );
        for (const newBudget of newBudgets) {
          const oldBudget = oldBudgets.find((b) => b.id === newBudget.id);
          const oldSpent = oldBudget ? Number(oldBudget.spentAmount) : 0;
          const newSpent = Number(newBudget.spentAmount);
          const limit = Number(newBudget.limitAmount);

          if (oldSpent <= limit && newSpent > limit && payment.user.email) {
            await this.mailService
              .budgetLimitHitWarning({
                to: payment.user.email,
                data: {
                  categoryName: payment.category.nameEn || 'Unnamed',
                  budgetLimit: limit,
                  spentAmount: newSpent,
                },
              })
              .catch((e) =>
                this.logger.error(
                  `Failed to send budget limit email: ${e.message}`,
                ),
              );
          }
        }

        this.logger.log(
          `Processed payment ${payment.id}, next execution: ${nextDate.toISOString()}`,
        );
      } catch (err) {
        this.logger.error(`Failed to process payment ${payment.id}`, err);
      }
    }
  }

  private calculateNextExecutionDate(
    currentDate: Date,
    frequency: PaymentFrequency,
  ): Date {
    const nextDate = new Date(currentDate);
    switch (frequency) {
      case PaymentFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case PaymentFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case PaymentFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case PaymentFrequency.MONTHLY:
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }
    return nextDate;
  }
}
