import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProviderVerificationStep } from './provider_verification_steps.entity';
import { StorageProvider } from '../common/enum';
import { BaseEntity } from '../common/base.entity';

@Entity('provider_verification_step_files')
export class ProviderVerificationStepFile extends BaseEntity {
  @ManyToOne(() => ProviderVerificationStep, s => s.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'step_id' })
  step!: ProviderVerificationStep;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl!: string;

  @Column({ name: 'storage', type: 'varchar', length: 20, default: 'AZURE_BLOB' })
  storage!: StorageProvider;

  @Column({ name: 'label', type: 'varchar', length: 20, nullable: true })
  label?: string | null;
}