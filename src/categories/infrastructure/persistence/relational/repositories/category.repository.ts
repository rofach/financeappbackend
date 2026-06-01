import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Category } from '../../../../domain/category';
import { CategoryRepository } from '../../category.repository';
import { CategoryMapper } from '../mappers/category.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class CategoryRelationalRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) { }

  async create(data: Category): Promise<Category> {
    const persistenceModel = CategoryMapper.toPersistence(data);
    const newEntity = await this.categoryRepository.save(
      this.categoryRepository.create(persistenceModel),
    );
    return CategoryMapper.toDomain(newEntity);
  }

  async findManyWithPagination(
    options: IPaginationOptions,
    userId: string,
  ): Promise<Category[]> {
    const entities = await this.categoryRepository.find({
      where: [{ user: { id: Number(userId) } }, { user: IsNull() }],
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return entities.map((entity) => CategoryMapper.toDomain(entity));
  }

  async findById(id: string): Promise<NullableType<Category>> {
    const entity = await this.categoryRepository.findOne({
      where: { id },
    });

    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async update(
    id: string,
    payload: Partial<Category>,
  ): Promise<Category | null> {
    const entity = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Category not found');
    }

    const updatedEntity = await this.categoryRepository.save(
      this.categoryRepository.create({
        ...entity,
        ...CategoryMapper.toPersistence(payload as Category),
      }),
    );

    return CategoryMapper.toDomain(updatedEntity);
  }

  async remove(id: Category['id']): Promise<void> {
    await this.categoryRepository.softDelete(id);
  }
}
