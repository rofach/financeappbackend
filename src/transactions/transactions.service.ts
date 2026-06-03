import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionRepository } from './infrastructure/persistence/transaction.repository';
import { AccountsService } from '../accounts/accounts.service';
import { CategoriesService } from '../categories/categories.service';
import { User } from '../users/domain/user';
import { Transaction } from './domain/transaction';
import {
  TransactionPaginationOptions,
  TransactionFilters,
} from './infrastructure/persistence/transaction.repository';

import { CurrenciesService } from '../currencies/currencies.service';
import { UsersService } from '../users/users.service';
import { BudgetsService } from '../budgets/budgets.service';
import {
  DEFAULT_CACHE_TIME_SECONDS,
  CACHE_KEYS_TRACKING_TIME_SECONDS,
} from '../utils/cache.constants';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountsService: AccountsService,
    private readonly categoriesService: CategoriesService,
    private readonly currenciesService: CurrenciesService,
    private readonly usersService: UsersService,
    private readonly budgetsService: BudgetsService,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {}

  private async trackCacheKey(userId: string, cacheKey: string) {
    const trackingSetKey = `transactions_keys_${userId}`;
    await this.redisClient.sAdd(trackingSetKey, cacheKey);
    await this.redisClient.expire(
      trackingSetKey,
      CACHE_KEYS_TRACKING_TIME_SECONDS,
    );
  }

  async clearCache(userId: string): Promise<void> {
    const trackingSetKey = `transactions_keys_${userId}`;
    const cachedKeys: string[] =
      await this.redisClient.sMembers(trackingSetKey);

    if (cachedKeys.length > 0) {
      await this.redisClient.del(cachedKeys);
      await this.redisClient.del(trackingSetKey);
    }
  }

  async create(createTransactionDto: CreateTransactionDto, user: User) {
    const account = await this.accountsService.findOne(
      user.id as string,
      createTransactionDto.accountId,
    );
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const category = await this.categoriesService.findOne(
      createTransactionDto.categoryId,
      user.id as string,
    );
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const fullUser = await this.usersService.findById(user.id as string);
    if (!fullUser) {
      throw new NotFoundException('User not found');
    }

    const accountCurrencyCode = account.currency.code;
    const userBaseCurrencyCode = fullUser.baseCurrency?.code || 'USD';

    let baseAmount = createTransactionDto.amount;

    if (accountCurrencyCode !== userBaseCurrencyCode) {
      const rates =
        await this.currenciesService.getExchangeRates(accountCurrencyCode);
      const conversionRate = rates[userBaseCurrencyCode];
      if (conversionRate) {
        baseAmount = createTransactionDto.amount * conversionRate;
      }
    }

    const createdTransaction = await this.transactionRepository.create({
      user,
      account,
      category,
      type: createTransactionDto.type,
      amount: createTransactionDto.amount,
      baseAmount,
      date: new Date(createTransactionDto.date),
      note: createTransactionDto.note || null,
    });

    await this.clearCache(user.id as string);
    await this.accountsService.clearCache(user.id as string);
    await this.budgetsService.clearCache(user.id as string);

    return createdTransaction;
  }

  async findAll(userId: string, pagination: TransactionPaginationOptions) {
    const cacheKey = `transactions_user_${userId}:all:${JSON.stringify(pagination)}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const transactions = await this.transactionRepository.findAllWithPagination(
      userId,
      pagination,
    );

    await this.redisClient.set(cacheKey, JSON.stringify(transactions), {
      EX: DEFAULT_CACHE_TIME_SECONDS,
    });
    await this.trackCacheKey(userId, cacheKey);
    return transactions;
  }

  async getStatistics(userId: string, filters: TransactionFilters) {
    const cacheKey = `transactions_user_${userId}:stats:${JSON.stringify(filters)}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const stats = await this.transactionRepository.aggregateStatistics(
      userId,
      filters,
    );

    await this.redisClient.set(cacheKey, JSON.stringify(stats), {
      EX: DEFAULT_CACHE_TIME_SECONDS,
    });
    await this.trackCacheKey(userId, cacheKey);
    return stats;
  }

  async findOne(userId: string, id: string) {
    return await this.transactionRepository.findOne(userId, id);
  }

  async update(
    userId: string,
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const transaction = await this.transactionRepository.findOne(userId, id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const payload: Partial<Transaction> = {};

    if (updateTransactionDto.accountId) {
      const account = await this.accountsService.findOne(
        userId,
        updateTransactionDto.accountId,
      );
      if (!account) throw new NotFoundException('Account not found');
      payload.account = account;
    }

    if (updateTransactionDto.categoryId) {
      const category = await this.categoriesService.findOne(
        updateTransactionDto.categoryId,
        userId,
      );
      if (!category) throw new NotFoundException('Category not found');
      payload.category = category;
    }

    if (updateTransactionDto.type !== undefined)
      payload.type = updateTransactionDto.type;
    if (updateTransactionDto.amount !== undefined)
      payload.amount = updateTransactionDto.amount;
    if (updateTransactionDto.date !== undefined)
      payload.date = new Date(updateTransactionDto.date);
    if (updateTransactionDto.note !== undefined)
      payload.note = updateTransactionDto.note;

    if (
      updateTransactionDto.amount !== undefined ||
      updateTransactionDto.accountId
    ) {
      const fullUser = await this.usersService.findById(userId);
      const userBaseCurrencyCode = fullUser?.baseCurrency?.code || 'USD';
      const accountToUse = payload.account || transaction.account;
      const accountCurrencyCode = accountToUse.currency.code;
      const amountToUse =
        updateTransactionDto.amount !== undefined
          ? updateTransactionDto.amount
          : transaction.amount;

      let baseAmount = amountToUse;

      if (accountCurrencyCode !== userBaseCurrencyCode) {
        const rates =
          await this.currenciesService.getExchangeRates(accountCurrencyCode);
        const conversionRate = rates[userBaseCurrencyCode];
        if (conversionRate) {
          baseAmount = amountToUse * conversionRate;
        }
      }
      payload.baseAmount = baseAmount;
    }

    const updatedTransaction = await this.transactionRepository.update(
      userId,
      id,
      payload,
    );

    await this.clearCache(userId);
    await this.accountsService.clearCache(userId);
    await this.budgetsService.clearCache(userId);

    return updatedTransaction;
  }

  async remove(userId: string, id: string) {
    await this.transactionRepository.softDelete(userId, id);

    await this.clearCache(userId);
    await this.accountsService.clearCache(userId);
    await this.budgetsService.clearCache(userId);
  }
}
