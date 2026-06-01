import { Module } from '@nestjs/common';
import { RecurringPaymentsRepository } from '../recurring-payments.repository';
import { RecurringPaymentsRelationalRepository } from './repositories/recurring-payments.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringPaymentsEntity } from './entities/recurring-payments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RecurringPaymentsEntity])],
  providers: [
    {
      provide: RecurringPaymentsRepository,
      useClass: RecurringPaymentsRelationalRepository,
    },
  ],
  exports: [RecurringPaymentsRepository],
})
export class RelationalRecurringPaymentsPersistenceModule {}
