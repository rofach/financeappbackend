import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrenciesService } from './currencies.service';
import { CurrenciesController } from './currencies.controller';
import { RelationalCurrencyPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { CurrencyRateEntity } from './infrastructure/persistence/relational/entities/currency-rate.entity';

@Module({
  imports: [
    RelationalCurrencyPersistenceModule,
    TypeOrmModule.forFeature([CurrencyRateEntity]),
  ],
  controllers: [CurrenciesController],
  providers: [CurrenciesService],
  exports: [CurrenciesService, RelationalCurrencyPersistenceModule],
})
export class CurrenciesModule {}
