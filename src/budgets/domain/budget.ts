import { User } from '../../users/domain/user';
import { Category } from '../../categories/domain/category';

export class Budget {
  id: string;
  user: User;
  category: Category;
  limitAmount: number;
  period: number;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  spentAmount?: number;
}
