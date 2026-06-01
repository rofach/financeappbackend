import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryRepository } from './infrastructure/persistence/category.repository';
import { User } from '../users/domain/user';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(createCategoryDto: CreateCategoryDto, userId: string) {
    const user = new User();
    user.id = userId;

    return this.categoryRepository.create({
      ...createCategoryDto,
      nameEn: createCategoryDto.nameEn ?? null,
      nameUk: createCategoryDto.nameUk ?? null,
      user,
    });
  }

  findManyWithPagination(options: IPaginationOptions, userId: string) {
    return this.categoryRepository.findManyWithPagination(options, userId);
  }

  async findOne(id: string, userId: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      const msg =
        I18nContext.current()?.t('categories.notFound', { args: { id } }) ||
        `Category with id ${id} not found`;
      throw new NotFoundException(msg);
    }

    if (category.user && category.user.id !== userId) {
      const msg =
        I18nContext.current()?.t('categories.noAccess') ||
        'You do not have access to this category';
      throw new ForbiddenException(msg);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
  ) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      const msg =
        I18nContext.current()?.t('categories.notFound', { args: { id } }) ||
        `Category with id ${id} not found`;
      throw new NotFoundException(msg);
    }

    if (!category.user) {
      const msg =
        I18nContext.current()?.t('categories.cannotEditGlobal') ||
        'Cannot edit global categories';
      throw new ForbiddenException(msg);
    }

    if (category.user.id !== userId) {
      const msg =
        I18nContext.current()?.t('categories.cannotEditNoAccess') ||
        'You do not have access to edit this category';
      throw new ForbiddenException(msg);
    }

    return this.categoryRepository.update(id, updateCategoryDto);
  }

  async remove(id: string, userId: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      const msg =
        I18nContext.current()?.t('categories.notFound', { args: { id } }) ||
        `Category with id ${id} not found`;
      throw new NotFoundException(msg);
    }

    if (!category.user) {
      const msg =
        I18nContext.current()?.t('categories.cannotDeleteGlobal') ||
        'Cannot delete global categories';
      throw new ForbiddenException(msg);
    }

    if (category.user.id !== userId) {
      const msg =
        I18nContext.current()?.t('categories.cannotDeleteNoAccess') ||
        'You do not have access to delete this category';
      throw new ForbiddenException(msg);
    }

    return this.categoryRepository.remove(id);
  }
}
