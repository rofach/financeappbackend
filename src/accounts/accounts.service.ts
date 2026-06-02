import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AccountRepository } from './infrastructure/persistence/account.repository';
import { CurrenciesService } from '../currencies/currencies.service';
import { UsersService } from '../users/users.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './domain/account';

@Injectable()
export class AccountsService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly currenciesService: CurrenciesService,
    private readonly usersService: UsersService,
  ) {}

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

    return await this.accountRepository.create(account);
  }

  async findAll(userId: string): Promise<Account[]> {
    return await this.accountRepository.findMany(userId);
  }

  async findOne(userId: string, id: string): Promise<Account> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.user.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this account',
      );
    }

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

    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.accountRepository.remove(id);
  }

  async recalculateBalance(userId: string, id: string): Promise<number> {
    const account = await this.findOne(userId, id);

    return account.balance;
  }
}
