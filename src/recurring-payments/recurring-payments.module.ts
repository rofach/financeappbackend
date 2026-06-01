import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { RecurringPaymentsService } from './recurring-payments.service';
import { RecurringPaymentsController } from './recurring-payments.controller';
import { RelationalRecurringPaymentsPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalRecurringPaymentsPersistenceModule,
  ],
  controllers: [RecurringPaymentsController],
  providers: [RecurringPaymentsService],
  exports: [
    RecurringPaymentsService,
    RelationalRecurringPaymentsPersistenceModule,
  ],
})
export class RecurringPaymentsModule {}
