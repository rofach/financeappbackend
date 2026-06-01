import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from '../entities/account.entity';
import { Account } from '../../../../domain/account';
import { AccountRepository } from '../../account.repository';
import { AccountMapper } from '../mappers/account.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';

import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class AccountsRelationalRepository implements AccountRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountsRepository: Repository<AccountEntity>,
  ) {}

  async create(
    data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Account> {
    const persistenceModel = AccountMapper.toPersistence(data as Account);
    const newEntity = await this.accountsRepository.save(
      this.accountsRepository.create(persistenceModel),
    );
    return AccountMapper.toDomain(newEntity);
  }

  async findAllWithPagination(
    userId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<Account[]> {
    const entities = await this.accountsRepository.find({
      where: {
        user: {
          id: Number(userId),
        },
      },
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return entities.map((entity) => AccountMapper.toDomain(entity));
  }

  async findOne(userId: string, id: string): Promise<Account | null> {
    const entity = await this.accountsRepository.findOne({
      where: {
        id,
        user: {
          id: Number(userId),
        },
      },
    });

    return entity ? AccountMapper.toDomain(entity) : null;
  }

  async findMany(userId: string): Promise<Account[]> {
    const entities = await this.accountsRepository.find({
      where: {
        user: {
          id: Number(userId),
        },
      },
    });

    return entities.map((entity) => AccountMapper.toDomain(entity));
  }

  async findById(id: Account['id']): Promise<NullableType<Account>> {
    const entity = await this.accountsRepository.findOne({
      where: { id },
    });

    return entity ? AccountMapper.toDomain(entity) : null;
  }

  async update(
    id: Account['id'],
    payload: DeepPartial<Account>,
  ): Promise<Account | null> {
    const entity = await this.accountsRepository.findOne({
      where: { id },
    });

    if (!entity) return null;

    const updatedEntity = await this.accountsRepository.save(
      this.accountsRepository.create(
        AccountMapper.toPersistence({
          ...AccountMapper.toDomain(entity),
          ...payload,
        } as Account),
      ),
    );

    return AccountMapper.toDomain(updatedEntity);
  }

  async remove(id: Account['id']): Promise<void> {
    await this.accountsRepository.softDelete(id);
  }
}
