import { ApiProperty } from '@nestjs/swagger';

import { User } from '../../users/domain/user';
import { Account } from '../../accounts/domain/account';
import { Category } from '../../categories/domain/category';

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
  type: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  frequency: number;

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
