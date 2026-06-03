import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
  Inject,
} from '@nestjs/common';

import { AccountRepository } from './infrastructure/persistence/account.repository';
import { CurrenciesService } from '../currencies/currencies.service';
import { UsersService } from '../users/users.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './domain/account';
import { DEFAULT_CACHE_TIME_SECONDS } from '../utils/cache.constants';

@Injectable()
export class AccountsService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly currenciesService: CurrenciesService,
    private readonly usersService: UsersService,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {}

  async clearCache(userId: string, accountId?: string): Promise<void> {
    await this.redisClient.del(`accounts_user_${userId}`);
    if (accountId) {
      await this.redisClient.del(`account_${accountId}_user_${userId}`);
    }
  }

  async create(
    userId: string,
    createAccountDto: CreateAccountDto,
  ): Promise<Account> {
    const currency = await this.currenciesService.findByCode(
      createAccountDto.currency,
    );
    if (!currency) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: {
          currency: 'currencyNotFound',
        },
      });
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const account = new Account();
    account.name = createAccountDto.name;
    account.currency = currency;
    account.balance = createAccountDto.balance ?? 0.0;
    account.user = user;

    const createdAccount = await this.accountRepository.create(account);
    await this.clearCache(userId);
    return createdAccount;
  }

  async findAll(userId: string): Promise<Account[]> {
    const cacheKey = `accounts_user_${userId}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const accounts = await this.accountRepository.findMany(userId);
    await this.redisClient.set(cacheKey, JSON.stringify(accounts), {
      EX: DEFAULT_CACHE_TIME_SECONDS,
    });
    return accounts;
  }

  async findOne(userId: string, id: string): Promise<Account> {
    const cacheKey = `account_${id}_user_${userId}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.user.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this account',
      );
    }

    await this.redisClient.set(cacheKey, JSON.stringify(account), {
      EX: DEFAULT_CACHE_TIME_SECONDS,
    });
    return account;
  }

  async update(
    userId: string,
    id: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    await this.findOne(userId, id);

    const updatedData: Partial<Account> = {};

    if (updateAccountDto.name !== undefined) {
      updatedData.name = updateAccountDto.name;
    }

    if (updateAccountDto.balance !== undefined) {
      updatedData.balance = updateAccountDto.balance;
    }

    if (updateAccountDto.currency !== undefined) {
      const currency = await this.currenciesService.findByCode(
        updateAccountDto.currency,
      );
      if (!currency) {
        throw new UnprocessableEntityException({
          status: 422,
          errors: {
            currency: 'currencyNotFound',
          },
        });
      }
      updatedData.currency = currency;
    }

    const updated = await this.accountRepository.update(id, updatedData);
    if (!updated) {
      throw new NotFoundException('Account not found');
    }

    await this.clearCache(userId, id);
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.accountRepository.remove(id);
    await this.clearCache(userId, id);
  }

  async recalculateBalance(userId: string, id: string): Promise<number> {
    const account = await this.findOne(userId, id);

    return account.balance;
  }
}
