import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateRecurringPaymentsDto } from './dto/create-recurring-payments.dto';
import { UpdateRecurringPaymentsDto } from './dto/update-recurring-payments.dto';
import { RecurringPaymentsRepository } from './infrastructure/persistence/recurring-payments.repository';
import { RecurringPayments } from './domain/recurring-payments';
import { AccountsService } from '../accounts/accounts.service';
import { CategoriesService } from '../categories/categories.service';
import { TransactionsService } from '../transactions/transactions.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../users/domain/user';

@Injectable()
export class RecurringPaymentsService {
  private readonly logger = new Logger(RecurringPaymentsService.name);

  constructor(
    private readonly recurringPaymentsRepository: RecurringPaymentsRepository,
    private readonly accountsService: AccountsService,
    private readonly categoriesService: CategoriesService,
    private readonly transactionsService: TransactionsService,
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

    const user = new User();
    user.id = userId;

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

    return await this.recurringPaymentsRepository.create(payment);
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

        const nextDate = new Date(payment.nextExecuteDate || new Date());
        if (payment.frequency === 1) nextDate.setDate(nextDate.getDate() + 1);
        else if (payment.frequency === 2)
          nextDate.setDate(nextDate.getDate() + 7);
        else if (payment.frequency === 3)
          nextDate.setMonth(nextDate.getMonth() + 1);
        else if (payment.frequency === 4)
          nextDate.setFullYear(nextDate.getFullYear() + 1);

        await this.recurringPaymentsRepository.update(payment.id, {
          nextExecuteDate: nextDate,
        });
        this.logger.log(
          `Processed payment ${payment.id}, next execution: ${nextDate.toISOString()}`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to process payment ${payment.id}: ${err.message}`,
        );
      }
    }
  }
}
