import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';
import { Job } from './job.entity';

@Entity('reviews')
@Unique(['jobId'])
export class Review extends BaseEntity {
  @Column({ name: 'job_id', type: 'uuid' })
  @Index()
  jobId!: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: Job;

  @Column({ name: 'seeker_id', type: 'uuid' })
  @Index()
  seekerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seeker_id' })
  seeker!: User;

  @Column({ name: 'provider_id', type: 'uuid' })
  @Index()
  providerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider!: User;

  @Column({ type: 'smallint' })
  rating!: number;

  @Column({ name: 'delivered_on_budget', type: 'boolean', nullable: true })
  deliveredOnBudget?: boolean | null;

  @Column({ name: 'delivered_on_time', type: 'boolean', nullable: true })
  deliveredOnTime?: boolean | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  title?: string | null;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;
}
