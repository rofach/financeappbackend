import { User } from '../../users/domain/user';
import { Currency } from '../../currencies/domain/currency';

export class Account {
  id: string;

  user: User;

  name: string;

  currency: Currency;

  balance: number;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date;
}
