import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyEntity } from './entities/currency.entity';
import { CurrencyRateEntity } from './entities/currency-rate.entity';
import { CurrencyRepository } from '../currency.repository';
import { CurrenciesRelationalRepository } from './repositories/currency.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CurrencyEntity, CurrencyRateEntity])],
  providers: [
    {
      provide: CurrencyRepository,
      useClass: CurrenciesRelationalRepository,
    },
  ],
  exports: [CurrencyRepository],
})
export class RelationalCurrencyPersistenceModule {}
