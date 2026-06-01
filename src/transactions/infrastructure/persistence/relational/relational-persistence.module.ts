import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionRepository } from '../transaction.repository';
import { TransactionRelationalRepository } from './repositories/transaction.repository';
import { TransactionSubscriber } from './subscribers/transaction.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity])],
  providers: [
    {
      provide: TransactionRepository,
      useClass: TransactionRelationalRepository,
    },
    TransactionSubscriber,
  ],
  exports: [TransactionRepository],
})
export class RelationalTransactionPersistenceModule {}
