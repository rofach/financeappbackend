import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from '../entities/transaction.entity';
import { Transaction } from '../../../../domain/transaction';
import { TransactionRepository } from '../../transaction.repository';
import { TransactionMapper } from '../mappers/transaction.mapper';

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
    options: { limit: number; offset: number; accountId?: string },
  ): Promise<Transaction[]> {
    const whereClause: any = { user: { id: Number(userId) } };
    if (options.accountId) {
      whereClause.account = { id: options.accountId };
    }

    const entities = await this.transactionRepository.find({
      where: whereClause,
      skip: options.offset,
      take: options.limit,
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    return entities.map((entity) => TransactionMapper.toDomain(entity));
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
      .andWhere('transaction.type = :type', { type: 2 })
      .getRawOne();

    return result?.sum ? Number(result.sum) : 0;
  }
}
