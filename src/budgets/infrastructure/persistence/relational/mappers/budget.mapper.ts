import { Budget } from '../../../../domain/budget';
import { BudgetEntity } from '../entities/budget.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { CategoryMapper } from '../../../../../categories/infrastructure/persistence/relational/mappers/category.mapper';

export class BudgetMapper {
  static toDomain(raw: BudgetEntity): Budget {
    const domainEntity = new Budget();
    domainEntity.id = raw.id;
    if (raw.user) {
      domainEntity.user = UserMapper.toDomain(raw.user);
    }
    if (raw.category) {
      domainEntity.category = CategoryMapper.toDomain(raw.category);
    }
    domainEntity.limitAmount = raw.limitAmount;
    domainEntity.period = raw.period;
    domainEntity.startDate = raw.startDate;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Budget): BudgetEntity {
    const persistenceEntity = new BudgetEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    if (domainEntity.user) {
      persistenceEntity.user = UserMapper.toPersistence(domainEntity.user);
    }
    if (domainEntity.category) {
      persistenceEntity.category = CategoryMapper.toPersistence(
        domainEntity.category,
      );
    }
    persistenceEntity.limitAmount = domainEntity.limitAmount;
    persistenceEntity.period = domainEntity.period;
    persistenceEntity.startDate = domainEntity.startDate;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt as any;

    return persistenceEntity;
  }
}
