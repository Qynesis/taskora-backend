import { Entity, ManyToOne, JoinColumn, Column, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';

/**
 * Stores a seeker's Stripe payment method token alongside safe card metadata
 * (brand, last4, expiry). Raw card data is never stored — Stripe owns PCI scope.
 */
@Entity('saved_payment_methods')
export class SavedPaymentMethod extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seeker_user_id' })
  @Index()
  seeker!: User;

  /** Stripe PaymentMethod ID (pm_xxx) */
  @Column({ name: 'stripe_payment_method_id', type: 'varchar', length: 255, unique: true })
  stripePaymentMethodId!: string;

  /** Card brand returned by Stripe: visa, mastercard, amex, etc. */
  @Column({ name: 'brand', type: 'varchar', length: 20, nullable: true })
  brand?: string | null;

  /** Last 4 digits of card number (safe to store, not PCI in-scope) */
  @Column({ name: 'last4', type: 'char', length: 4, nullable: true })
  last4?: string | null;

  @Column({ name: 'exp_month', type: 'smallint', nullable: true })
  expMonth?: number | null;

  @Column({ name: 'exp_year', type: 'smallint', nullable: true })
  expYear?: number | null;

  /** Whether this is the user's default payment method */
  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  /** Stripe card fingerprint — stable hash of the card number used to prevent duplicate cards per user */
  @Column({ name: 'fingerprint', type: 'varchar', length: 255, nullable: true })
  fingerprint?: string | null;
}
