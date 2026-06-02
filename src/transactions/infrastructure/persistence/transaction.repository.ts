import { Transaction } from '../../domain/transaction';
import { TransactionType } from '../../domain/transaction-type.enum';

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
}

export interface TransactionPaginationOptions extends TransactionFilters {
  limit: number;
  offset: number;
}

export abstract class TransactionRepository {
  abstract create(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Transaction>;

  abstract findAllWithPagination(
    userId: string,
    options: TransactionPaginationOptions,
  ): Promise<Transaction[]>;

  abstract aggregateStatistics(
    userId: string,
    filters: TransactionFilters,
  ): Promise<{ totalIncome: number; totalExpense: number; netBalance: number }>;

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
