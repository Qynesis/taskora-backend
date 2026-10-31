import { Entity, ManyToOne, JoinColumn, Column, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { numericTransformer } from '../common/numeric.transformer';
import { User } from './user.entity';
import { Payment } from './payment.entity';
import { Refund } from './refund.entity';
import { TransactionType } from '../common/enum';

/**
 * Unified financial ledger entry for the admin Transaction History view.
 * Each row represents one observable money movement in the platform:
 *   - PAYMENT: seeker pays for a job
 *   - REFUND: money returned to a seeker (cancellation or approved refund request)
 *
 * One record is appended whenever a Payment is captured or a Refund is issued.
 * All amounts in dollars (AUD).
 */
@Entity('transactions')
export class Transaction extends BaseEntity {
  /** Human-readable reference shown in admin UI. Includes the full Stripe ID + timestamp
   *  for subscription cycles (e.g. SUB-sub_1Tb0ZMEnyQvLwTWw9EBXXlOX-1779723456099), so
   *  the column is sized for that — Stripe sub IDs are 28 chars on their own. */
  @Column({ name: 'txn_ref', type: 'varchar', length: 80, unique: true })
  txnRef!: string;

  @Column({ name: 'type', type: 'enum', enum: TransactionType, enumName: 'transaction_type' })
  type!: TransactionType;

  /** The seeker who initiated the payment or who receives the refund */
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sender_user_id' })
  @Index()
  sender!: User;

  /** Linked payment record (set for type = PAYMENT and for refund-linked entries) */
  @ManyToOne(() => Payment, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'payment_id' })
  @Index()
  payment?: Payment | null;

  /** Linked Stripe refund record (set for type = REFUND) */
  @ManyToOne(() => Refund, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'refund_id' })
  refund?: Refund | null;

  /** Amount involved in this transaction, in dollars */
  @Column({ name: 'amount', type: 'numeric', precision: 10, scale: 2, transformer: numericTransformer })
  amount!: number;

  @Column({ name: 'currency', type: 'char', length: 3, default: 'AUD' })
  currency!: string;

  /** Stripe invoice ID tied to this transaction (in_xxx) */
  @Column({ name: 'stripe_invoice_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  stripeInvoiceId?: string | null;

  /** Stripe subscription ID — set for subscription cycle payments, null for one-time */
  @Column({ name: 'stripe_subscription_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  stripeSubscriptionId?: string | null;

  /** Stripe PaymentIntent ID for this transaction — needed to issue refunds per cycle */
  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId?: string | null;

  /** Stripe Charge ID for this transaction — needed to issue refunds per cycle */
  @Column({ name: 'stripe_charge_id', type: 'varchar', length: 255, nullable: true })
  stripeChargeId?: string | null;

  /** Platform fee taken from this transaction, in dollars */
  @Column({ name: 'platform_fee', type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: numericTransformer })
  platformFee?: number | null;

  /** Amount paid out to the provider from this transaction, in dollars */
  @Column({ name: 'provider_payout', type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: numericTransformer })
  providerPayout?: number | null;

  /** GST/tax component of this transaction, in dollars (Stripe-computed per charge/cycle) */
  @Column({ name: 'tax_gst_amount', type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: numericTransformer })
  taxGstAmmount?: number | null;

  /** Stripe invoice number (e.g. "INV-0001") — populated for invoiced payments */
  @Column({ name: 'invoice_number', type: 'varchar', length: 50, nullable: true })
  invoiceNumber?: string | null;

  /** Direct link to this movement's Stripe-hosted invoice page (per charge / per cycle) */
  @Column({ name: 'hosted_invoice_url', type: 'text', nullable: true })
  hostedInvoiceUrl?: string | null;

  /** Human-readable note (e.g. "Installment 2 of 4 — JB-00124 · Weekly garden maintenance") */
  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null;
}
