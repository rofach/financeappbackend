import { User } from '../../users/domain/user';
import { Account } from '../../accounts/domain/account';
import { Category } from '../../categories/domain/category';
import { TransactionType } from './transaction-type.enum';

export class Transaction {
  id: string;

  user: User;

  account: Account;

  category: Category;

  type: TransactionType;

  amount: number;

  baseAmount: number;

  date: Date;

  note: string | null;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date;
}
