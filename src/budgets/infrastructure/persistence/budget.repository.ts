import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { Budget } from '../../domain/budget';

export abstract class BudgetRepository {
  abstract create(
    data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Budget>;

  abstract findAll(userId: string): Promise<Budget[]>;

  abstract findById(id: Budget['id']): Promise<NullableType<Budget>>;

  abstract findByCategoryId(
    userId: string,
    categoryId: string,
  ): Promise<Budget[]>;

  abstract update(
    id: Budget['id'],
    payload: DeepPartial<Budget>,
  ): Promise<Budget | null>;

  abstract remove(id: Budget['id']): Promise<void>;
}
