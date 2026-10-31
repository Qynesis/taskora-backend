import { Entity, ManyToOne, JoinColumn, Column, Unique, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Job } from './job.entity';
import { User } from './user.entity';
import { SubscriptionStatus } from '../common/enum';

// Subscription "header": links a job to its live Stripe subscription and tracks lifecycle + term.
// The money/fee ledger lives on `transactions` (per cycle) and `payments` (contract total);
// engagement/duration config lives on `Job`. This row must not duplicate either of those.
@Entity('subscriptions')
@Unique(['job'])
export class Subscription extends BaseEntity {
  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: Job;

  @ManyToOne(() => User, (u) => u.subscriptionsAsSeeker, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seeker_user_id' })
  @Index()
  seeker!: User;

  @ManyToOne(() => User, (u) => u.subscriptionsAsProvider, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'provider_user_id' })
  @Index()
  provider!: User;

  // Stripe Billing identifiers
  @Column({ name: 'stripe_subscription_id', type: 'varchar', length: 255, nullable: true })
  @Index({ unique: true, where: '"stripe_subscription_id" IS NOT NULL' })
  stripeSubscriptionId?: string | null;

  @Column({ name: 'stripe_price_id', type: 'varchar', length: 255, nullable: true })
  stripePriceId?: string | null;

  @Column({ name: 'stripe_product_id', type: 'varchar', length: 255, nullable: true })
  stripeProductId?: string | null;

  // The provider Stripe account (acct_xxx) this subscription actually bills against. Captured at
  // activation because it is point-in-time truth — a provider can later delete/reconnect Stripe,
  // so the account derived from the provider now may differ from the one that took these charges.
  @Column({ name: 'connected_account_id', type: 'varchar', length: 255, nullable: true })
  connectedAccountId?: string | null;

  @Column({ name: 'status', type: 'enum', enum: SubscriptionStatus, enumName: 'subscription_status', default: SubscriptionStatus.INCOMPLETE })
  @Index()
  status!: SubscriptionStatus;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: string | null;
}
