import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetRepository } from './infrastructure/persistence/budget.repository';
import { Budget } from './domain/budget';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { TransactionRepository } from '../transactions/infrastructure/persistence/transaction.repository';
import {
  DEFAULT_CACHE_TIME_SECONDS,
  CACHE_KEYS_TRACKING_TIME_SECONDS,
} from '../utils/cache.constants';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly categoriesService: CategoriesService,
    private readonly transactionRepository: TransactionRepository,
    private readonly usersService: UsersService,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {}

  private async trackCacheKey(userId: string, cacheKey: string) {
    const trackingSetKey = `budgets_keys_${userId}`;
    await this.redisClient.sAdd(trackingSetKey, cacheKey);
    await this.redisClient.expire(
      trackingSetKey,
      CACHE_KEYS_TRACKING_TIME_SECONDS,
    );
  }

  async clearCache(userId: string): Promise<void> {
    const trackingSetKey = `budgets_keys_${userId}`;
    const cachedKeys: string[] =
      await this.redisClient.sMembers(trackingSetKey);

    if (cachedKeys.length > 0) {
      await this.redisClient.del(cachedKeys);
      await this.redisClient.del(trackingSetKey);
    }
  }

  private async getBudgetWithSpentAmount(
    budgets: Budget[],
    userId: string,
  ): Promise<Budget[]> {
    for (const budget of budgets) {
      const endDate = new Date(budget.startDate);
      if (budget.period === 1) {
        endDate.setDate(endDate.getDate() + 7);
      } else if (budget.period === 2) {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (budget.period === 3) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const spent = await this.transactionRepository.calculateSpentAmount(
        userId,
        budget.category.id,
        budget.startDate,
        endDate,
      );
      budget.spentAmount = spent;
    }

    return budgets;
  }

  async create(createBudgetDto: CreateBudgetDto, userId: string) {
    const category = await this.categoriesService.findOne(
      createBudgetDto.categoryId,
      userId,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newBudget = new Budget();
    newBudget.limitAmount = createBudgetDto.limitAmount;
    newBudget.period = createBudgetDto.period;
    newBudget.startDate = new Date(createBudgetDto.startDate);
    newBudget.user = user;
    newBudget.category = category;

    const createdBudget = await this.budgetRepository.create(newBudget);
    await this.clearCache(userId);
    return createdBudget;
  }

  async findAll(userId: string) {
    const cacheKey = `budgets_user_${userId}:all`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const budgets = await this.budgetRepository.findAll(userId);
    const result = await this.getBudgetWithSpentAmount(budgets, userId);

    await this.redisClient.set(cacheKey, JSON.stringify(result), {
      EX: DEFAULT_CACHE_TIME_SECONDS,
    });
    await this.trackCacheKey(userId, cacheKey);
    return result;
  }

  async findByCategoryId(userId: string, categoryId: string) {
    const cacheKey = `budgets_user_${userId}:category_${categoryId}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const budgets = await this.budgetRepository.findByCategoryId(
      userId,
      categoryId,
    );
    const result = await this.getBudgetWithSpentAmount(budgets, userId);

    await this.redisClient.set(cacheKey, JSON.stringify(result), {
      EX: DEFAULT_CACHE_TIME_SECONDS,
    });
    await this.trackCacheKey(userId, cacheKey);
    return result;
  }

  async findOne(userId: string, id: string) {
    const cacheKey = `budgets_user_${userId}:id_${id}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const budget = await this.budgetRepository.findById(id);
    if (!budget) return budget;

    await this.redisClient.set(cacheKey, JSON.stringify(budget), {
      EX: DEFAULT_CACHE_TIME_SECONDS,
    });
    await this.trackCacheKey(userId, cacheKey);
    return budget;
  }

  async update(userId: string, id: string, updateBudgetDto: UpdateBudgetDto) {
    const budget = await this.budgetRepository.findById(id);
    if (!budget || budget.user.id !== userId) {
      throw new NotFoundException('Budget not found');
    }

    const payload: Partial<Budget> = {};
    if (updateBudgetDto.limitAmount !== undefined) {
      payload.limitAmount = updateBudgetDto.limitAmount;
    }
    if (updateBudgetDto.period !== undefined) {
      payload.period = updateBudgetDto.period;
    }
    if (updateBudgetDto.startDate !== undefined) {
      payload.startDate = new Date(updateBudgetDto.startDate);
    }
    if (updateBudgetDto.categoryId !== undefined) {
      const category = await this.categoriesService.findOne(
        updateBudgetDto.categoryId,
        userId,
      );
      if (!category) throw new NotFoundException('Category not found');
      payload.category = category;
    }

    const updatedBudget = await this.budgetRepository.update(id, payload);
    await this.clearCache(userId);
    return updatedBudget;
  }

  async remove(userId: string, id: string) {
    const budget = await this.budgetRepository.findById(id);
    if (!budget || budget.user.id !== userId) {
      throw new NotFoundException('Budget not found');
    }
    await this.budgetRepository.remove(id);
    await this.clearCache(userId);
  }
}
