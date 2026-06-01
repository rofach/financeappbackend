import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { Account } from '../../domain/account';

export abstract class AccountRepository {
  abstract create(
    data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Account>;

  abstract findMany(userId: string): Promise<Account[]>;

  abstract findById(id: Account['id']): Promise<NullableType<Account>>;

  abstract update(
    id: Account['id'],
    payload: DeepPartial<Account>,
  ): Promise<Account | null>;

  abstract remove(id: Account['id']): Promise<void>;
}
