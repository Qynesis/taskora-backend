import { Entity, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';
import { ProviderWorkInfo } from './provider_work_info.entity';
import { ProviderProfessionalDetails } from './provider_professional_details.entity';
import { ProviderBankDetails } from './provider_bank_details.entity';
import { ProviderCertification } from './provider_certification.entity';
import { ProviderEmployee } from './provider_employee.entity';
import { ProviderVerificationCase } from './provider_verification_cases.entity';

@Entity('profiles')
export class Profile extends BaseEntity {

    @Column({ name: 'user_id', type: 'uuid', unique: true })
    user_id!: string;

    @OneToOne(() => User, u => u.profile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ name: 'first_name', type: 'varchar', length: 100 })
    firstName?: string;

    @Column({ name: 'last_name', type: 'varchar', length: 100 })
    lastName?: string;

    // Locked once an admin approves the IDENTITY verification step: the name is then KYC-verified
    // against the ID document and Stripe, so it must not drift. Cleared on rejection so the provider
    // can correct it and resubmit.
    @Column({ name: 'name_locked', type: 'boolean', default: false })
    nameLocked!: boolean;

    @Column({ name: 'phone', type: 'varchar', length: 50 })
    phone?: string;

    @ApiProperty({ description: 'Whether the phone number has been verified via OTP', example: false })
    @Column({ name: 'phone_verified', type: 'boolean', default: false })
    phoneVerified!: boolean;

    @Column({ name: 'avatar_url', type: 'text', nullable: true })
    avatarUrl?: string | null;

    @Column({ name: 'date_of_birth', type: 'date' })
    date_of_birth?: Date;

    // Address fields
    @Column({ name: 'street_address', type: 'varchar', length: 200 })
    streetAddress?: string;

    @Column({ name: 'suburb', type: 'varchar', length: 100 })
    suburb?: string;

    @Column({ name: 'state', type: 'varchar', length: 50 })
    state?: string;

    @Column({ name: 'postcode', type: 'varchar', length: 10 })
    postcode?: string;

    @Column({ name: 'country', type: 'varchar', length: 2 })
    country?: string;

    @OneToOne(() => ProviderWorkInfo, (wi) => wi.profile)
    workInfo?: ProviderWorkInfo;

    @OneToOne(() => ProviderProfessionalDetails, (pd) => pd.profile)
    professionalDetails?: ProviderProfessionalDetails;

    @OneToOne(() => ProviderBankDetails, (bd) => bd.profile)
    bankDetails?: ProviderBankDetails;

    @OneToMany(() => ProviderCertification, (c) => c.profile)
    certifications?: ProviderCertification[];

    @OneToMany(() => ProviderEmployee, (e) => e.profile)
    employees?: ProviderEmployee[];

    @OneToOne(() => ProviderVerificationCase, (vc) => vc.profile)
    verificationCase?: ProviderVerificationCase;
}
