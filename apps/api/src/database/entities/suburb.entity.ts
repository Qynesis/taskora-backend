import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { State } from './state.entity';

@Entity('suburbs')
export class Suburb extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 100 })
  @Index()
  name!: string;

  // 4 digits, leading zeros significant (NT is 08xx) — hence varchar, not numeric.
  // Nullable only for rows seeded before the column existed; the seed always sets it.
  @Column({ name: 'postcode', type: 'varchar', length: 4, nullable: true })
  @Index()
  postcode?: string | null;

  @Column({ name: 'state_id', type: 'uuid' })
  @Index()
  stateId!: string;

  @ManyToOne(() => State, (s) => s.suburbs, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'state_id' })
  state!: State;
}
