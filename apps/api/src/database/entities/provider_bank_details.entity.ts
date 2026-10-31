import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Profile } from './profile.entity';
import { BaseEntity } from '../common/base.entity';
import { EncryptionTransformer } from '../../security/ale/transformers/encryption.transformer';

@Entity('provider_bank_details')
export class ProviderBankDetails extends BaseEntity {
  @PrimaryColumn({ name: 'profile_id', type: 'uuid' })
  profileId!: string;

  @OneToOne(() => Profile, (p) => p.bankDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile!: Profile;

  @Column({ name: 'bank_name', type: 'varchar', length: 512, transformer: new EncryptionTransformer() })
  bankName!: string;

  @Column({ name: 'account_number', type: 'varchar', length: 512, transformer: new EncryptionTransformer() })
  accountNumber!: string;

  @Column({ name: 'bsb_number', type: 'varchar', length: 512, nullable: true, transformer: new EncryptionTransformer() })
  bsbNumber?: string | null;

  @Column({ name: 'account_holder_name', type: 'varchar', length: 512, transformer: new EncryptionTransformer() })
  accountHolderName!: string;
}
