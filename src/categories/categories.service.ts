import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryRepository } from './infrastructure/persistence/category.repository';
import { UsersService } from '../users/users.service';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { I18nContext } from 'nestjs-i18n';
import {
  DEFAULT_CACHE_TIME_SECONDS,
  CACHE_KEYS_TRACKING_TIME_SECONDS,
} from '../utils/cache.constants';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly usersService: UsersService,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {}

  private async trackCacheKey(userId: string, cacheKey: string) {
    const trackingSetKey = `categories_keys_${userId}`;
    await this.redisClient.sAdd(trackingSetKey, cacheKey);
    await this.redisClient.expire(
      trackingSetKey,
      CACHE_KEYS_TRACKING_TIME_SECONDS,
    );
  }

  async clearCache(userId: string, categoryId?: string): Promise<void> {
    if (categoryId) {
      await this.redisClient.del(`category_${categoryId}_user_${userId}`);
    }

    const trackingSetKey = `categories_keys_${userId}`;
    const cachedKeys: string[] =
      await this.redisClient.sMembers(trackingSetKey);

    if (cachedKeys.length > 0) {
      await this.redisClient.del(cachedKeys);
      await this.redisClient.del(trackingSetKey);
    }
  }

  async create(createCategoryDto: CreateCategoryDto, userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const createdCategory = await this.categoryRepository.create({
      ...createCategoryDto,
      nameEn: createCategoryDto.nameEn ?? null,
      nameUk: createCategoryDto.nameUk ?? null,
      user,
    });

    await this.clearCache(userId);
    return createdCategory;
  }

  async findManyWithPagination(options: IPaginationOptions, userId: string) {
    const cacheKey = `categories_user_${userId}_page_${options.page}_limit_${options.limit}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const categories = await this.categoryRepository.findManyWithPagination(
      options,
      userId,
    );
    await this.redisClient.set(cacheKey, JSON.stringify(categories), {
      EX: DEFAULT_CACHE_TIME_SECONDS,
    });
    await this.trackCacheKey(userId, cacheKey);
    return categories;
  }

  async findOne(id: string, userId: string) {
    const cacheKey = `category_${id}_user_${userId}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

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

    await this.redisClient.set(cacheKey, JSON.stringify(category), {
      EX: DEFAULT_CACHE_TIME_SECONDS,
    });
    await this.trackCacheKey(userId, cacheKey);
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

    const updated = await this.categoryRepository.update(id, updateCategoryDto);
    await this.clearCache(userId, id);
    return updated;
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

    await this.categoryRepository.remove(id);
    await this.clearCache(userId, id);
  }
}
