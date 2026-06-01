import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'currency_rate' })
export class CurrencyRateEntity extends EntityRelationalHelper {
  @PrimaryColumn({ type: String })
  baseCode: string;

  @Column({ type: 'jsonb', nullable: true })
  rates: Record<string, number>;

  @UpdateDateColumn()
  updatedAt: Date;
}
