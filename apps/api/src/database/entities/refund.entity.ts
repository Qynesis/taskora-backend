import { Entity, ManyToOne, JoinColumn, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { numericTransformer } from '../common/numeric.transformer';
import { Payment } from './payment.entity';

@Entity('refunds')
@Unique(['stripeRefundId'])
export class Refund extends BaseEntity {
    @ManyToOne(() => Payment, (p) => p.refunds, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'payment_id' })
    @Index()
    payment!: Payment;

    @Column({ name: 'stripe_refund_id', type: 'varchar', length: 255 })
    stripeRefundId!: string;

    @Column({ name: 'stripe_charge_id', type: 'varchar', length: 255, nullable: true })
    stripeChargeId?: string | null;

    @Column({ name: 'amount', type: 'numeric', precision: 10, scale: 2, transformer: numericTransformer })
    amount!: number;

    @Column({ name: 'reason', type: 'varchar', length: 50, nullable: true })
    reason?: string | null;

    @Column({ name: 'application_fee_refunded', type: 'numeric', precision: 10, scale: 2, default: 0, transformer: numericTransformer })
    applicationFeeRefunded!: number;

    @Column({ name: 'transfer_reversed_fee', type: 'numeric', precision: 10, scale: 2, default: 0, transformer: numericTransformer })
    transferReversedFee!: number;

    @Column({ name: 'status', type: 'varchar', length: 30, default: 'succeeded' })
    status!: string;

    /** Stripe Credit Note ID — created for every refund that has an associated invoice */
    @Column({ name: 'stripe_credit_note_id', type: 'varchar', length: 255, nullable: true, unique: true })
    stripeCreditNoteId?: string | null;

    /** Stripe-generated Credit Note PDF download URL */
    @Column({ name: 'credit_note_pdf_url', type: 'text', nullable: true })
    creditNotePdfUrl?: string | null;
}