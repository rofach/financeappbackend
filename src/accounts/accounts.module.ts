import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { RelationalAccountPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [RelationalAccountPersistenceModule, CurrenciesModule],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService, RelationalAccountPersistenceModule],
})
export class AccountsModule {}
