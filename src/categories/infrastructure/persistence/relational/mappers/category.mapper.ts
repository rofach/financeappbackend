import { Category } from '../../../../domain/category';
import { CategoryEntity } from '../entities/category.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';

export class CategoryMapper {
  static toDomain(raw: CategoryEntity): Category {
    const domainEntity = new Category();
    domainEntity.id = raw.id;
    if (raw.user) {
      domainEntity.user = UserMapper.toDomain(raw.user);
    } else {
      domainEntity.user = null;
    }
    domainEntity.nameEn = raw.nameEn;
    domainEntity.nameUk = raw.nameUk;
    domainEntity.type = raw.type;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Category): CategoryEntity {
    const persistenceEntity = new CategoryEntity();
    if (domainEntity.id && domainEntity.id !== '') {
      persistenceEntity.id = domainEntity.id;
    }
    if (domainEntity.user) {
      persistenceEntity.user = UserMapper.toPersistence(domainEntity.user);
    } else {
      persistenceEntity.user = null;
    }
    persistenceEntity.nameEn = domainEntity.nameEn;
    persistenceEntity.nameUk = domainEntity.nameUk;
    persistenceEntity.type = domainEntity.type;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;

    return persistenceEntity;
  }
}
