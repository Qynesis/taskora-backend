import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Profile } from './profile.entity';
import { CertificationStatus } from '../common/enum';

@Entity('provider_certifications')
export class ProviderCertification extends BaseEntity {
  @Column({ name: 'profile_id', type: 'uuid' })
  profileId!: string;

  @ManyToOne(() => Profile, (p) => p.certifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile!: Profile;

  @Column({ name: 'name', type: 'varchar', length: 200 })
  name!: string;

  @Column({ name: 'license_number', type: 'varchar', length: 100, nullable: true })
  licenseNumber?: string | null;

  @Column({ name: 'license_type', type: 'varchar', length: 100, nullable: true })
  licenseType?: string | null;

  @Column({ name: 'state', type: 'varchar', length: 50, nullable: true })
  state?: string | null;

  @Column({ name: 'postcode', type: 'varchar', length: 10, nullable: true })
  postcode?: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: CertificationStatus,
    default: CertificationStatus.PENDING,
  })
  status!: CertificationStatus;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;
}
