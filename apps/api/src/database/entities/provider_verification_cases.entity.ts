import { Entity, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Profile } from './profile.entity';
import { ProviderVerificationStep } from './provider_verification_steps.entity';
import { VerificationStatus } from '../common/enum';
import { BaseEntity } from '../common/base.entity';

@Entity('provider_verification_cases')
export class ProviderVerificationCase extends BaseEntity {
    @Column({ name: 'profile_id', type: 'uuid', unique: true })
    profileId!: string;

    @OneToOne(() => Profile, (p) => p.verificationCase, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'profile_id' })
    profile!: Profile;

    @Column({ name: 'status', type: 'varchar', length: 20, default: 'pending' })
    status!: VerificationStatus;

    @OneToMany(() => ProviderVerificationStep, s => s.case)
    steps!: ProviderVerificationStep[];
}
