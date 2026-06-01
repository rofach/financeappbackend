import { Column, Entity, PrimaryColumn } from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'currency' })
export class CurrencyEntity extends EntityRelationalHelper {
  @PrimaryColumn({ type: String })
  code: string;

  @Column({ type: String })
  name: string;
}
