import { Currency } from '../../domain/currency';
import { NullableType } from '../../../utils/types/nullable.type';

export abstract class CurrencyRepository {
  abstract create(data: Currency): Promise<Currency>;
  abstract findByCode(code: string): Promise<NullableType<Currency>>;
  abstract findMany(): Promise<Currency[]>;
  abstract upsertMany(data: Currency[]): Promise<void>;
}
