import { User } from '../../users/domain/user';
import { Account } from '../../accounts/domain/account';
import { Category } from '../../categories/domain/category';

export class Transaction {
  id: string;

  user: User;

  account: Account;

  category: Category;

  type: number;

  amount: number;

  baseAmount: number;

  date: Date;

  note: string | null;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date;
}
