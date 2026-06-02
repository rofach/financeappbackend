import { ApiProperty } from '@nestjs/swagger';

import { User } from '../../users/domain/user';
import { Account } from '../../accounts/domain/account';
import { Category } from '../../categories/domain/category';
import { PaymentFrequency } from '../enums/payment-frequency.enum';
import { TransactionType } from '../../transactions/domain/transaction-type.enum';

export class RecurringPayments {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  user: User;

  @ApiProperty()
  account: Account;

  @ApiProperty()
  category: Category;

  @ApiProperty()
  type: TransactionType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  frequency: PaymentFrequency;

  @ApiProperty()
  beginDate: Date;

  @ApiProperty()
  nextExecuteDate: Date | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date | null;
}
