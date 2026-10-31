import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

/**
 * Cached provider performance metrics, recomputed off the PROVIDER_STATS queue whenever a job
 * reaches a terminal status or a review changes. See ProviderStatsService.
 *
 * Separate from ProviderRatingSummary on purpose: that one is maintained by an incremental
 * delta on review insert, while every column here is a full recompute from source.
 */
@Entity({ name: 'provider_performance_stats', schema: 'service' })
export class ProviderPerformanceStats {
  @PrimaryColumn({ name: 'provider_id', type: 'uuid' })
  providerId!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'provider_id' })
  provider!: User;

  @Column({ name: 'jobs_done', type: 'int', default: 0 })
  jobsDone!: number;

  @Column({ name: 'jobs_cancelled', type: 'int', default: 0 })
  jobsCancelled!: number;

  @Column({ name: 'rehired', type: 'int', default: 0 })
  rehired!: number;

  // Nullable throughout: null means "nothing to measure yet" (no terminal jobs / no reviews),
  // which the DTOs already distinguish from 0.
  @Column({ name: 'job_success_rate', type: 'numeric', precision: 4, scale: 1, nullable: true })
  jobSuccessRate?: string | null;

  @Column({ name: 'recommendation_rate', type: 'numeric', precision: 4, scale: 1, nullable: true })
  recommendationRate?: string | null;

  @Column({ name: 'on_time_rate', type: 'numeric', precision: 4, scale: 1, nullable: true })
  onTimeRate?: string | null;

  @Column({ name: 'on_budget_rate', type: 'numeric', precision: 4, scale: 1, nullable: true })
  onBudgetRate?: string | null;

  @Column({ name: 'computed_at', type: 'timestamptz', default: () => 'now()' })
  computedAt!: Date;
}
