import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Suburb } from './suburb.entity';

@Entity('states')
export class State extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ name: 'code', type: 'char', length: 3, unique: true })
  @Index()
  code!: string;

  @OneToMany(() => Suburb, (s) => s.state)
  suburbs!: Suburb[];
}
