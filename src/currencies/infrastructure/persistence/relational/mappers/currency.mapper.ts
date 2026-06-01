import { Currency } from '../../../../domain/currency';
import { CurrencyEntity } from '../entities/currency.entity';

export class CurrencyMapper {
  static toDomain(raw: CurrencyEntity): Currency {
    const domainEntity = new Currency();
    domainEntity.code = raw.code;
    domainEntity.name = raw.name;
    return domainEntity;
  }

  static toPersistence(domainEntity: Currency): CurrencyEntity {
    const persistenceEntity = new CurrencyEntity();
    persistenceEntity.code = domainEntity.code;
    persistenceEntity.name = domainEntity.name;
    return persistenceEntity;
  }
}
