import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetRepository } from './infrastructure/persistence/budget.repository';
import { Budget } from './domain/budget';
import { CategoriesService } from '../categories/categories.service';
import { User } from '../users/domain/user';
import { TransactionRepository } from '../transactions/infrastructure/persistence/transaction.repository';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly categoriesService: CategoriesService,
    private readonly transactionRepository: TransactionRepository,
  ) { }

  private async enrichBudgetsWithSpentAmounts(
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

    const newBudget = new Budget();
    newBudget.limitAmount = createBudgetDto.limitAmount;
    newBudget.period = createBudgetDto.period;
    newBudget.startDate = new Date(createBudgetDto.startDate);

    const user = new User();
    user.id = userId;
    newBudget.user = user;
    newBudget.category = category;

    return await this.budgetRepository.create(newBudget);
  }

  async findAll(userId: string) {
    const budgets = await this.budgetRepository.findAll(userId);
    return await this.enrichBudgetsWithSpentAmounts(budgets, userId);
  }

  async findByCategoryId(userId: string, categoryId: string) {
    const budgets = await this.budgetRepository.findByCategoryId(
      userId,
      categoryId,
    );
    return await this.enrichBudgetsWithSpentAmounts(budgets, userId);
  }

  async findOne(userId: string, id: string) {
    return await this.budgetRepository.findById(id);
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

    return await this.budgetRepository.update(id, payload);
  }

  async remove(userId: string, id: string) {
    const budget = await this.budgetRepository.findById(id);
    if (!budget || budget.user.id !== userId) {
      throw new NotFoundException('Budget not found');
    }
    return await this.budgetRepository.remove(id);
  }
}
