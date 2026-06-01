import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from './entities/account.entity';
import { AccountRepository } from '../account.repository';
import { AccountsRelationalRepository } from './repositories/account.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  providers: [
    {
      provide: AccountRepository,
      useClass: AccountsRelationalRepository,
    },
  ],
  exports: [AccountRepository],
})
export class RelationalAccountPersistenceModule {}
