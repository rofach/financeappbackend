import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { RelationalTransactionPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AccountsModule } from '../accounts/accounts.module';
import { CategoriesModule } from '../categories/categories.module';
import { CurrenciesModule } from '../currencies/currencies.module';
import { UsersModule } from '../users/users.module';
import { BudgetsModule } from '../budgets/budgets.module';

@Module({
  imports: [
    RelationalTransactionPersistenceModule,
    AccountsModule,
    CategoriesModule,
    CurrenciesModule,
    UsersModule,
    BudgetsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
