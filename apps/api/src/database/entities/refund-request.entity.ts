import { Entity, ManyToOne, JoinColumn, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { numericTransformer } from '../common/numeric.transformer';
import { Job } from './job.entity';
import { User } from './user.entity';
import { Payment } from './payment.entity';
import { RefundEvidencePhoto } from './refund-evidence-photo.entity';
import { RefundRequestReason, RefundRequestStatus } from '../common/enum';

/**
 * A post-service refund request submitted by a seeker.
 * Distinct from the automatic cancellation refund (JobCancellation):
 *   - submitted after the job is marked completed
 *   - requires admin review + approve / reject decision
 *   - both parties can upload evidence photos (RefundEvidencePhoto)
 * All amounts in dollars (AUD).
 */
@Entity('refund_requests')
export class RefundRequest extends BaseEntity {
  @ManyToOne(() => Job, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'job_id' })
  @Index()
  job!: Job;

  @ManyToOne(() => Payment, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'payment_id' })
  @Index()
  payment!: Payment;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'seeker_user_id' })
  @Index()
  seeker!: User;

  @Column({ name: 'reason', type: 'enum', enum: RefundRequestReason, enumName: 'refund_request_reason' })
  reason!: RefundRequestReason;

  @Column({ name: 'comments', type: 'text', nullable: true })
  comments?: string | null;

  /** Amount the seeker is requesting to be refunded, in dollars */
  @Column({ name: 'requested_amount', type: 'numeric', precision: 10, scale: 2, transformer: numericTransformer })
  requestedAmount!: number;

  @Column({ name: 'currency', type: 'char', length: 3, default: 'AUD' })
  currency!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: RefundRequestStatus,
    enumName: 'refund_request_status',
    default: RefundRequestStatus.PENDING,
  })
  status!: RefundRequestStatus;

  // ── Review ──────────────────────────────────────────────────────────────────

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date | null;

  /** Admin explanation when rejecting the request */
  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;

  /** Stripe refund ID (re_xxx) — populated once admin approves and Stripe processes refund */
  @Column({ name: 'stripe_refund_id', type: 'varchar', length: 255, nullable: true, unique: true })
  stripeRefundId?: string | null;

  /** Evidence photos from seeker (submission) and admin (rejection counter-evidence) */
  @OneToMany(() => RefundEvidencePhoto, (p) => p.refundRequest)
  evidencePhotos!: RefundEvidencePhoto[];
}
