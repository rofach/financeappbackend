import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
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
import {
  DEFAULT_CACHE_TIME_SECONDS,
  CACHE_KEYS_TRACKING_TIME_SECONDS,
} from '../utils/cache.constants';

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
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {}

  private async trackCacheKey(cacheKey: string) {
    const trackingSetKey = `recurring_payments_keys`;
    await this.redisClient.sAdd(trackingSetKey, cacheKey);
    await this.redisClient.expire(
      trackingSetKey,
      CACHE_KEYS_TRACKING_TIME_SECONDS,
    );
  }

  async clearCache(): Promise<void> {
    const trackingSetKey = `recurring_payments_keys`;
    const cachedKeys: string[] =
      await this.redisClient.sMembers(trackingSetKey);

    if (cachedKeys.length > 0) {
      await this.redisClient.del(cachedKeys);
      await this.redisClient.del(trackingSetKey);
    }
  }

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

    await this.clearCache();
    return savedPayment;
  }

  async findAll() {
    const cacheKey = `recurring_payments_all`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const payments =
      await this.recurringPaymentsRepository.findAllWithPagination({
        paginationOptions: { page: 1, limit: 100 },
      });

    await this.redisClient.set(cacheKey, JSON.stringify(payments), {
      EX: DEFAULT_CACHE_TIME_SECONDS,
    });
    await this.trackCacheKey(cacheKey);
    return payments;
  }

  async findById(id: RecurringPayments['id']) {
    const cacheKey = `recurring_payment_${id}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const payment = await this.recurringPaymentsRepository.findById(id);
    if (!payment) return payment;

    await this.redisClient.set(cacheKey, JSON.stringify(payment), {
      EX: DEFAULT_CACHE_TIME_SECONDS,
    });
    await this.trackCacheKey(cacheKey);
    return payment;
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

    const updatedPayment = await this.recurringPaymentsRepository.update(
      id,
      payload,
    );
    await this.clearCache();
    return updatedPayment;
  }

  async remove(id: RecurringPayments['id'], userId: string) {
    const payment = await this.findById(id);
    if (!payment || payment.user.id !== userId)
      throw new NotFoundException('Payment not found');

    await this.recurringPaymentsRepository.remove(id);
    await this.clearCache();
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

        const newAccount = await this.accountsService.findOne(
          userId,
          payment.account.id,
        );
        if (newAccount) {
          const newBalance = Number(newAccount.balance);
          if (oldBalance >= 0 && newBalance < 0 && payment.user.email) {
            this.mailService
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
