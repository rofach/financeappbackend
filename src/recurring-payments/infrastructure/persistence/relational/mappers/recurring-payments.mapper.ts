import { RecurringPayments } from '../../../../domain/recurring-payments';
import { RecurringPaymentsEntity } from '../entities/recurring-payments.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { AccountMapper } from '../../../../../accounts/infrastructure/persistence/relational/mappers/account.mapper';
import { CategoryMapper } from '../../../../../categories/infrastructure/persistence/relational/mappers/category.mapper';

export class RecurringPaymentsMapper {
  static toDomain(raw: RecurringPaymentsEntity): RecurringPayments {
    const domainEntity = new RecurringPayments();
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
    domainEntity.frequency = raw.frequency;
    domainEntity.beginDate = raw.beginDate;
    domainEntity.nextExecuteDate = raw.nextExecuteDate;
    domainEntity.isActive = raw.isActive;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    return domainEntity;
  }

  static toPersistence(
    domainEntity: RecurringPayments,
  ): RecurringPaymentsEntity {
    const persistenceEntity = new RecurringPaymentsEntity();
    if (domainEntity.id) {
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
    persistenceEntity.frequency = domainEntity.frequency;
    persistenceEntity.beginDate = domainEntity.beginDate;
    persistenceEntity.nextExecuteDate = domainEntity.nextExecuteDate;
    persistenceEntity.isActive = domainEntity.isActive;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    if (
      domainEntity.deletedAt !== undefined &&
      domainEntity.deletedAt !== null
    ) {
      persistenceEntity.deletedAt = domainEntity.deletedAt;
    }
    return persistenceEntity;
  }
}
