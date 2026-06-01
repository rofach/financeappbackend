import { Account } from '../../../../domain/account';
import { AccountEntity } from '../entities/account.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { CurrencyMapper } from '../../../../../currencies/infrastructure/persistence/relational/mappers/currency.mapper';

export class AccountMapper {
  static toDomain(raw: AccountEntity): Account {
    const domainEntity = new Account();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.balance =
      typeof raw.balance === 'string' ? parseFloat(raw.balance) : raw.balance;

    if (raw.user) {
      domainEntity.user = UserMapper.toDomain(raw.user);
    }
    if (raw.currency) {
      domainEntity.currency = CurrencyMapper.toDomain(raw.currency);
    }

    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Account): AccountEntity {
    const persistenceEntity = new AccountEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.balance = domainEntity.balance;

    if (domainEntity.user) {
      persistenceEntity.user = UserMapper.toPersistence(domainEntity.user);
    }
    if (domainEntity.currency) {
      persistenceEntity.currency = CurrencyMapper.toPersistence(
        domainEntity.currency,
      );
    }

    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;

    return persistenceEntity;
  }
}
