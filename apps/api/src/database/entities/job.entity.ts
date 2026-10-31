import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { numericTransformer } from '../common/numeric.transformer';
import { User } from './user.entity';
import { Category } from './category.entity';
import { JobStatus, JobType, EngagementType, BillingType, ServiceDuration, ServiceFrequency, BillingPeriod } from '../common/enum';
import { JobPhoto } from './job-photo.entity';
import { Bid } from './bid.entity';

@Entity('jobs')
@Index(['seeker', 'status'])
@Index(['status', 'createdAt'])
export class Job extends BaseEntity {
    @Column({ name: 'job_ref', type: 'varchar', length: 12, unique: true, nullable: false })
    @Index()
    jobRef!: string;

    @ManyToOne(() => User, (u) => u.jobs, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'seeker_user_id' })
    @Index()
    seeker!: User;

    /** Null for DIRECT jobs (no title needed) */
    @Column({ name: 'title', type: 'varchar', length: 200, nullable: true })
    title?: string | null;

    @Column({ name: 'description', type: 'text', nullable: true })
    description?: string | null;

    @ManyToOne(() => Category, (c) => c.jobs, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'category_id' })
    @Index()
    category?: Category | null;

    // Address
    @Column({ name: 'location_text', type: 'varchar', length: 200, nullable: true })
    locationText?: string | null;

    // Budget
    @Column({ name: 'budget_price', type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: numericTransformer })
    budgetPrice?: number | null;

    /** Total contract budget (budgetPrice × periods). Equals budgetPrice for single_task jobs. */
    @Column({ name: 'total_budget', type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: numericTransformer })
    totalBudget?: number | null;

    @Column({ name: 'currency', type: 'char', length: 3, default: 'AUD' })
    currency!: string;

    /** Discriminator: open-bidding job vs seeker directly booking a provider */
    @Column({ name: 'type', type: 'enum', enum: JobType, enumName: 'job_type', default: JobType.BIDDING })
    @Index()
    type!: JobType;

    // Lifecycle
    @Column({ name: 'status', type: 'enum', enum: JobStatus, enumName: 'job_status', default: JobStatus.POSTED })
    @Index()
    status!: JobStatus;

    /** Primary service duration selected by the seeker at job creation */
    @Column({ name: 'service_duration', type: 'enum', enum: ServiceDuration, enumName: 'service_duration', nullable: true })
    serviceDuration?: ServiceDuration | null;

    /** true = seeker is flexible on time (no startTime/endTime required), false = fixed time slot */
    @Column({ name: 'is_flexible_time', type: 'boolean', nullable: true })
    isFlexibleTime?: boolean | null;

    // Engagement (derived from serviceDuration; kept for booking-module compatibility)
    @Column({ name: 'engagement', type: 'enum', enum: EngagementType, enumName: 'engagement_type', default: EngagementType.SINGLE })
    engagement!: EngagementType;

    @Column({ name: 'duration_months', type: 'int', nullable: true })
    durationMonths?: number | null;

    @Column({ name: 'billing_pref', type: 'enum', enum: BillingType, enumName: 'billing_type', nullable: true })
    billingPref?: BillingType | null;

    /** The provider for this job — set at creation for DIRECT, set on bid selection for BIDDING */
    @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
    @JoinColumn({ name: 'provider_user_id' })
    @Index()
    provider?: User | null;

    @ManyToOne(() => Bid, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'selected_bid_id' })
    selectedBid?: Bid | null;

    @Column({ name: 'selected_at', type: 'timestamptz', nullable: true })
    selectedAt?: Date | null;

    // ── Scheduling ────────────────────────────────────────────────────────────

    @Column({ name: 'start_date', type: 'date', nullable: true })
    startDate?: string | null;

    @Column({ name: 'end_date', type: 'date', nullable: true })
    endDate?: string | null;

    /** Service window start time stored as HH:MM (24h) */
    @Column({ name: 'start_time', type: 'varchar', length: 10, nullable: true })
    startTime?: string | null;

    /** Service window end time stored as HH:MM (24h) */
    @Column({ name: 'end_time', type: 'varchar', length: 10, nullable: true })
    endTime?: string | null;

    @Column({ name: 'frequency', type: 'enum', enum: ServiceFrequency, enumName: 'service_frequency', nullable: true })
    frequency?: ServiceFrequency | null;

    /** Active weekdays when frequency = CUSTOM_DAYS e.g. ['monday','wednesday'] */
    @Column({ name: 'scheduled_days', type: 'simple-array', nullable: true })
    scheduledDays?: string[] | null;

    @Column({ name: 'total_hours', type: 'numeric', precision: 6, scale: 2, nullable: true })
    totalHours?: number | null;

    /** Billing cadence for total hours (weekly / fortnightly / monthly) */
    @Column({ name: 'total_hours_period', type: 'enum', enum: BillingPeriod, enumName: 'billing_period', nullable: true })
    totalHoursPeriod?: BillingPeriod | null;

    /** Billing cadence for budget price (weekly / fortnightly / monthly) */
    @Column({ name: 'budget_period', type: 'enum', enum: BillingPeriod, enumName: 'billing_period', nullable: true })
    budgetPeriod?: BillingPeriod | null;

    @OneToMany(() => JobPhoto, (p) => p.job) photos!: JobPhoto[];
}