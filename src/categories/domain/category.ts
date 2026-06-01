import { User } from '../../users/domain/user';

export class Category {
  id: string;
  user: User | null;
  nameEn: string | null;
  nameUk: string | null;
  type: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
