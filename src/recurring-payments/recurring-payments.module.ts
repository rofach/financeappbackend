import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { RecurringPaymentsService } from './recurring-payments.service';
import { RecurringPaymentsController } from './recurring-payments.controller';
import { RelationalRecurringPaymentsPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AccountsModule } from '../accounts/accounts.module';
import { CategoriesModule } from '../categories/categories.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalRecurringPaymentsPersistenceModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    UsersModule,
  ],
  controllers: [RecurringPaymentsController],
  providers: [RecurringPaymentsService],
  exports: [
    RecurringPaymentsService,
    RelationalRecurringPaymentsPersistenceModule,
  ],
})
export class RecurringPaymentsModule {}
