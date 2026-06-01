import { Transaction } from '../../domain/transaction';

export abstract class TransactionRepository {
  abstract create(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Transaction>;

  abstract findAllWithPagination(
    userId: string,
    options: { limit: number; offset: number; accountId?: string },
  ): Promise<Transaction[]>;

  abstract findOne(userId: string, id: string): Promise<Transaction | null>;

  abstract update(
    userId: string,
    id: string,
    data: Partial<
      Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'user'>
    >,
  ): Promise<Transaction | null>;

  abstract softDelete(userId: string, id: string): Promise<void>;

  abstract calculateSpentAmount(
    userId: string,
    categoryId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number>;
}
