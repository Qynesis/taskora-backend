import { Entity, ManyToOne, JoinColumn, Column, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Subscription } from './subscription.entity';
import { User } from './user.entity';
import { SubscriptionCancellationReason, SubscriptionCancellationStatus } from '../common/enum';

/**
 * A seeker's request to cancel a recurring subscription.
 * Per platform policy a minimum 14-day notice period is required:
 *   effectiveAt = requestedAt + 14 days.
 * Status moves from PENDING → PROCESSED once the subscription is actually
 * cancelled in Stripe at effectiveAt, or WITHDRAWN if the seeker revokes the request.
 */
@Entity('subscription_cancellation_requests')
export class SubscriptionCancellationRequest extends BaseEntity {
  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  @Index()
  subscription!: Subscription;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seeker_user_id' })
  @Index()
  seeker!: User;

  @Column({
    name: 'reason',
    type: 'enum',
    enum: SubscriptionCancellationReason,
    enumName: 'subscription_cancellation_reason',
  })
  reason!: SubscriptionCancellationReason;

  /** Free-text elaboration (required when reason = OTHER, optional otherwise) */
  @Column({ name: 'custom_reason', type: 'text', nullable: true })
  customReason?: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: SubscriptionCancellationStatus,
    enumName: 'subscription_cancellation_status',
    default: SubscriptionCancellationStatus.PENDING,
  })
  status!: SubscriptionCancellationStatus;

  /** When the seeker submitted the request */
  @Column({ name: 'requested_at', type: 'timestamptz' })
  requestedAt!: Date;

  /** requestedAt + 14 days — the date the subscription will actually terminate */
  @Column({ name: 'effective_at', type: 'timestamptz' })
  effectiveAt!: Date;

  /** When the subscription was actually cancelled in Stripe */
  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt?: Date | null;
}
