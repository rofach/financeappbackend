import { Transaction } from '../../../../domain/transaction';
import { TransactionEntity } from '../entities/transaction.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { AccountMapper } from '../../../../../accounts/infrastructure/persistence/relational/mappers/account.mapper';
import { CategoryMapper } from '../../../../../categories/infrastructure/persistence/relational/mappers/category.mapper';

export class TransactionMapper {
  static toDomain(raw: TransactionEntity): Transaction {
    const domainEntity = new Transaction();
    domainEntity.id = raw.id;
    if (raw.user) {
      domainEntity.user = UserMapper.toDomain(raw.user);
    }
    if (raw.account) {
      domainEntity.account = AccountMapper.toDomain(raw.account);
    }
    if (raw.category) {
      domainEntity.category = CategoryMapper.toDomain(raw.category);
    }
    domainEntity.type = raw.type;
    domainEntity.amount = raw.amount;
    domainEntity.baseAmount = raw.baseAmount;
    domainEntity.date = raw.date;
    domainEntity.note = raw.note;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Transaction): TransactionEntity {
    const persistenceEntity = new TransactionEntity();
    if (domainEntity.id && domainEntity.id !== '') {
      persistenceEntity.id = domainEntity.id;
    }
    if (domainEntity.user) {
      persistenceEntity.user = UserMapper.toPersistence(domainEntity.user);
    }
    if (domainEntity.account) {
      persistenceEntity.account = AccountMapper.toPersistence(
        domainEntity.account,
      );
    }
    if (domainEntity.category) {
      persistenceEntity.category = CategoryMapper.toPersistence(
        domainEntity.category,
      );
    }
    persistenceEntity.type = domainEntity.type;
    persistenceEntity.amount = domainEntity.amount;
    persistenceEntity.baseAmount = domainEntity.baseAmount;
    persistenceEntity.date = domainEntity.date;
    persistenceEntity.note = domainEntity.note;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;

    return persistenceEntity;
  }
}
