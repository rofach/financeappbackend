import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { TransactionEntity } from '../entities/transaction.entity';
import { Transaction } from '../../../../domain/transaction';
import {
  TransactionRepository,
  TransactionPaginationOptions,
  TransactionFilters,
} from '../../transaction.repository';
import { TransactionMapper } from '../mappers/transaction.mapper';
import { TransactionType } from '../../../../domain/transaction-type.enum';

@Injectable()
export class TransactionRelationalRepository implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  async create(data: Transaction): Promise<Transaction> {
    const persistenceModel = TransactionMapper.toPersistence(data);
    const newEntity = await this.transactionRepository.save(
      this.transactionRepository.create(persistenceModel),
    );
    return TransactionMapper.toDomain(newEntity);
  }

  async findAllWithPagination(
    userId: string,
    options: TransactionPaginationOptions,
  ): Promise<Transaction[]> {
    const whereClause: any = { user: { id: Number(userId) } };
    if (options.accountId) {
      whereClause.account = { id: options.accountId };
    }
    if (options.categoryId) {
      whereClause.category = { id: options.categoryId };
    }
    if (options.type) {
      whereClause.type = options.type;
    }
    if (options.startDate && options.endDate) {
      whereClause.date = Between(options.startDate, options.endDate);
    } else if (options.startDate) {
      whereClause.date = MoreThanOrEqual(options.startDate);
    } else if (options.endDate) {
      whereClause.date = LessThanOrEqual(options.endDate);
    }

    const entities = await this.transactionRepository.find({
      where: whereClause,
      skip: options.offset,
      take: options.limit,
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    return entities.map((entity) => TransactionMapper.toDomain(entity));
  }

  async aggregateStatistics(
    userId: string,
    filters: TransactionFilters,
  ): Promise<{
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  }> {
    const qb = this.transactionRepository
      .createQueryBuilder('t')
      .select('t.type', 'type')
      .addSelect('SUM(t.baseAmount)', 'sum')
      .where('t.user = :userId', { userId: Number(userId) });

    if (filters.accountId) {
      qb.andWhere('t.account = :accountId', { accountId: filters.accountId });
    }
    if (filters.categoryId) {
      qb.andWhere('t.category = :categoryId', {
        categoryId: filters.categoryId,
      });
    }
    if (filters.type) {
      qb.andWhere('t.type = :type', { type: filters.type });
    }
    if (filters.startDate) {
      qb.andWhere('t.date >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      qb.andWhere('t.date <= :endDate', { endDate: filters.endDate });
    }

    qb.groupBy('t.type');

    const results = await qb.getRawMany();

    let totalIncome = 0;
    let totalExpense = 0;

    for (const row of results) {
      const sum = Number(row.sum) || 0;
      if (row.type === TransactionType.INCOME) {
        totalIncome += sum;
      } else if (row.type === TransactionType.EXPENSE) {
        totalExpense += sum;
      }
    }

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }

  async findOne(userId: string, id: string): Promise<Transaction | null> {
    const entity = await this.transactionRepository.findOne({
      where: { id, user: { id: Number(userId) } },
    });
    return entity ? TransactionMapper.toDomain(entity) : null;
  }

  async update(
    userId: string,
    id: string,
    payload: Partial<Transaction>,
  ): Promise<Transaction | null> {
    const entity = await this.transactionRepository.findOne({
      where: { id, user: { id: Number(userId) } },
    });

    if (!entity) {
      throw new NotFoundException('Transaction not found');
    }

    const updatedEntity = await this.transactionRepository.save(
      this.transactionRepository.create({
        ...entity,
        ...TransactionMapper.toPersistence(payload as Transaction),
      }),
    );

    return TransactionMapper.toDomain(updatedEntity);
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const entity = await this.transactionRepository.findOne({
      where: { id, user: { id: Number(userId) } },
    });

    if (!entity) {
      throw new NotFoundException('Transaction not found');
    }
    await this.transactionRepository.softRemove(entity);
  }

  async calculateSpentAmount(
    userId: string,
    categoryId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.baseAmount)', 'sum')
      .where('transaction.user = :userId', { userId: Number(userId) })
      .andWhere('transaction.category = :categoryId', { categoryId })
      .andWhere('transaction.date >= :startDate', { startDate })
      .andWhere('transaction.date <= :endDate', { endDate })
      .andWhere('transaction.type = :type', { type: TransactionType.EXPENSE })
      .getRawOne();

    return result?.sum ? Number(result.sum) : 0;
  }
}
