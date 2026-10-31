import { Entity, OneToOne, JoinColumn, Column } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { numericTransformer } from '../common/numeric.transformer';
import { Job } from './job.entity';
import { ContractPaymentFrequency } from '../common/enum';

/**
 * Stores the contractual agreement terms for a long-duration job (non-single-task).
 * Created by the seeker after selecting a provider, before payment is initiated.
 */
@Entity('job_contracts')
export class JobContract extends BaseEntity {
  @OneToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: Job;

  /** Deposit amount in the job's currency (optional, sent directly from frontend) */
  @Column({ name: 'deposit_amount', type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: numericTransformer })
  depositAmount?: number | null;

  /** How often the provider will be paid */
  @Column({
    name: 'payment_frequency',
    type: 'enum',
    enum: ContractPaymentFrequency,
    enumName: 'contract_payment_frequency',
  })
  paymentFrequency!: ContractPaymentFrequency;

  /** Whether either party can end the contract early (14-day written notice applies) */
  @Column({ name: 'early_termination', type: 'boolean', default: false })
  earlyTermination!: boolean;

  /** Provider's duty not to reveal confidential seeker information */
  @Column({ name: 'confidentiality_clause', type: 'boolean', default: true })
  confidentialityClause!: boolean;

  /** Optional additional clause text provided by the seeker */
  @Column({ name: 'additional_clause', type: 'text', nullable: true })
  additionalClause?: string | null;
}
