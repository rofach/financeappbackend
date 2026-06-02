import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { AccountEntity } from '../../../../../accounts/infrastructure/persistence/relational/entities/account.entity';
import { CategoryEntity } from '../../../../../categories/infrastructure/persistence/relational/entities/category.entity';
import { PaymentFrequency } from '../../../../enums/payment-frequency.enum';
import { TransactionType } from '../../../../../transactions/domain/transaction-type.enum';

@Entity({
  name: 'recurring_payments',
})
export class RecurringPaymentsEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: UserEntity;

  @ManyToOne(() => AccountEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'account_id' })
  @Index()
  account: AccountEntity;

  @ManyToOne(() => CategoryEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  @Index()
  category: CategoryEntity;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  @Column({ type: 'enum', enum: PaymentFrequency })
  frequency: PaymentFrequency;

  @Column({ type: 'date' })
  beginDate: Date;

  @Column({ type: 'date', nullable: true })
  nextExecuteDate: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
