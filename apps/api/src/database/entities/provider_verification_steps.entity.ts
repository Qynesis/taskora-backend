import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { ProviderVerificationCase } from './provider_verification_cases.entity';
import { ProviderVerificationStepFile } from './provider_verification_step_files.entity';
import { VerificationStatus, VerificationStepType, IdentityType, RightToWorkStatus, CitizenDocumentType, RejectionReason } from '../common/enum';

@Entity('provider_verification_steps')
export class ProviderVerificationStep extends BaseEntity {
  @ManyToOne(() => ProviderVerificationCase, c => c.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  case!: ProviderVerificationCase;

  @Column({ name: 'step_type', type: 'varchar', length: 32 })
  stepType!: VerificationStepType;

  // Step 1 (Business)
  @Column({ name: 'abn', type: 'varchar', length: 20, nullable: true })
  abn?: string | null;

  // Step 2 (Identity)
  @Column({ name: 'identity_type', type: 'varchar', length: 20, nullable: true })
  identityType?: IdentityType | null;

  // Step 3 (Right to Work)
  @Column({ name: 'right_to_work_status', type: 'varchar', length: 20, nullable: true })
  rightToWorkStatus?: RightToWorkStatus | null;

  @Column({ name: 'citizen_document_type', type: 'varchar', length: 30, nullable: true })
  citizenDocumentType?: CitizenDocumentType | null;

  // Step 5 (Police)
  @Column({ name: 'police_ref_no', type: 'varchar', length: 64, nullable: true })
  policeRefNo?: string | null;

  // Step 5 (Selfie — Stripe Identity)
  @Column({ name: 'stripe_identity_session_id', type: 'varchar', length: 64, nullable: true })
  stripeIdentitySessionId?: string | null;

  // ---- Review / status ----
  @Column({ name: 'status', type: 'varchar', length: 20, default: 'pending' })
  status!: VerificationStatus;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date | null;

  @Column({ name: 'rejection_reason', type: 'varchar', length: 40, nullable: true })
  rejectionReason?: RejectionReason | null;

  @Column({ name: 'rejection_note', type: 'text', nullable: true })
  rejectionNote?: string | null;

  @OneToMany(() => ProviderVerificationStepFile, f => f.step)
  files!: ProviderVerificationStepFile[];
}
