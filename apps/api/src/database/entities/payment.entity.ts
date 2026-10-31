import { Entity, ManyToOne, JoinColumn, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { numericTransformer } from '../common/numeric.transformer';
import { Job } from './job.entity';
import { User } from './user.entity';
import { PaymentStatus } from '../common/enum';
import { Refund } from './refund.entity';
import { PlatformFeeConfig } from './platform-fee-config.entity';

@Entity('payments')
export class Payment extends BaseEntity {
    @ManyToOne(() => Job, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'job_id' })
    @Index()
    job?: Job | null;

    @ManyToOne(() => User, (u) => u.paymentsAsSeeker, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'seeker_user_id' })
    @Index()
    seeker!: User;

    @ManyToOne(() => User, (u) => u.paymentsAsProvider, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'provider_user_id' })
    @Index()
    provider!: User;

    // Amounts — stored as dollar values (e.g. 125.50 = $125.50 AUD).
    // The Payment row is the tax-free "deal": the original job price and how it splits between
    // platform and provider. GST is NOT here — it's added on top of the price and recorded,
    // per money movement, on the Transaction ledger (along with the actual charged amounts).
    // `amount` = original price (bid.price): single-task = job price (excl. GST),
    // subscription = total contract value.
    @Column({ name: 'amount', type: 'numeric', precision: 10, scale: 2, transformer: numericTransformer })
    amount!: number;

    /** Platform's share of the original price (amount × platform charge %). Set at selection. */
    @Column({ name: 'platform_fee', type: 'numeric', precision: 10, scale: 2, default: 0, transformer: numericTransformer })
    platformFee!: number;

    /** Provider's share of the original price (amount − platformFee). Set at selection. */
    @Column({ name: 'provider_amount', type: 'numeric', precision: 10, scale: 2, default: 0, transformer: numericTransformer })
    providerAmount!: number;

    @Column({ name: 'currency', type: 'char', length: 3, default: 'AUD' })
    currency!: string;

    @Column({ name: 'status', type: 'enum', enum: PaymentStatus, enumName: 'payment_status', default: PaymentStatus.PENDING })
    @Index()
    status!: PaymentStatus;

    @Column({ name: 'method', type: 'varchar', length: 50, nullable: true })
    method?: string | null;

    @Column({ name: 'is_subscription', type: 'boolean', default: false })
    isSubscription!: boolean;

    /** Direct link to the Stripe-hosted invoice page (shareable with seeker) */
    @Column({ name: 'hosted_invoice_url', type: 'text', nullable: true })
    hostedInvoiceUrl?: string | null;

    /** Fee config snapshot active at the time of this payment — for audit trail */
    @ManyToOne(() => PlatformFeeConfig, { onDelete: 'RESTRICT', nullable: true })
    @JoinColumn({ name: 'fee_config_id' })
    feeConfig?: PlatformFeeConfig | null;

    @OneToMany(() => Refund, (r) => r.payment)
    refunds!: Refund[];
}
