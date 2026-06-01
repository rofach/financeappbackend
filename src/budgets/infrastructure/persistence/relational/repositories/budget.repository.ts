import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetEntity } from '../entities/budget.entity';
import { Budget } from '../../../../domain/budget';
import { BudgetRepository } from '../../budget.repository';
import { BudgetMapper } from '../mappers/budget.mapper';

@Injectable()
export class BudgetRelationalRepository implements BudgetRepository {
  constructor(
    @InjectRepository(BudgetEntity)
    private readonly budgetRepository: Repository<BudgetEntity>,
  ) {}

  async create(data: Budget): Promise<Budget> {
    const persistenceModel = BudgetMapper.toPersistence(data);
    const newEntity = await this.budgetRepository.save(
      this.budgetRepository.create(persistenceModel),
    );
    return BudgetMapper.toDomain(newEntity);
  }

  async findAll(userId: string): Promise<Budget[]> {
    const entities = await this.budgetRepository.find({
      where: { user: { id: Number(userId) } },
    });
    return entities.map((entity) => BudgetMapper.toDomain(entity));
  }

  async findById(id: string): Promise<Budget | null> {
    const entity = await this.budgetRepository.findOne({
      where: { id },
    });
    return entity ? BudgetMapper.toDomain(entity) : null;
  }

  async findByCategoryId(
    userId: string,
    categoryId: string,
  ): Promise<Budget[]> {
    const entities = await this.budgetRepository.find({
      where: { user: { id: Number(userId) }, category: { id: categoryId } },
    });
    return entities.map((entity) => BudgetMapper.toDomain(entity));
  }

  async update(id: string, payload: Partial<Budget>): Promise<Budget | null> {
    const entity = await this.budgetRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Budget not found');
    }

    const updatedEntity = await this.budgetRepository.save(
      this.budgetRepository.create({
        ...entity,
        ...BudgetMapper.toPersistence(payload as Budget),
      }),
    );

    return BudgetMapper.toDomain(updatedEntity);
  }

  async remove(id: string): Promise<void> {
    await this.budgetRepository.softDelete(id);
  }
}
