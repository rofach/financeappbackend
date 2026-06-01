import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { RecurringPayments } from '../../domain/recurring-payments';

export abstract class RecurringPaymentsRepository {
  abstract create(
    data: Omit<
      RecurringPayments,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
  ): Promise<RecurringPayments>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<RecurringPayments[]>;

  abstract findDuePayments(date: Date): Promise<RecurringPayments[]>;

  abstract findById(
    id: RecurringPayments['id'],
  ): Promise<NullableType<RecurringPayments>>;

  abstract findByIds(
    ids: RecurringPayments['id'][],
  ): Promise<RecurringPayments[]>;

  abstract update(
    id: RecurringPayments['id'],
    payload: DeepPartial<RecurringPayments>,
  ): Promise<RecurringPayments | null>;

  abstract remove(id: RecurringPayments['id']): Promise<void>;
}
