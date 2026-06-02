import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { BudgetEntity } from './infrastructure/persistence/relational/entities/budget.entity';
import { BudgetRepository } from './infrastructure/persistence/budget.repository';
import { BudgetRelationalRepository } from './infrastructure/persistence/relational/repositories/budget.repository';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';
import { RelationalTransactionPersistenceModule } from '../transactions/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BudgetEntity]),
    CategoriesModule,
    RelationalTransactionPersistenceModule,
    UsersModule,
  ],
  controllers: [BudgetsController],
  providers: [
    BudgetsService,
    {
      provide: BudgetRepository,
      useClass: BudgetRelationalRepository,
    },
  ],
  exports: [BudgetsService],
})
export class BudgetsModule {}
