import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { Profile } from './profile.entity';
import { ProviderCategory } from './provider-category.entity';
import { ProviderSkill } from './provider-skill.entity';
import { ProviderMedia } from './provider_media.entity';
import { BaseEntity } from '../common/base.entity';

@Entity('provider_professional_details')
export class ProviderProfessionalDetails extends BaseEntity {
    @PrimaryColumn({ name: 'profile_id', type: 'uuid' })
    profileId!: string;

    @OneToOne(() => Profile, (p) => p.professionalDetails, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'profile_id' })
    profile!: Profile;

    @Column({ name: 'rate_per_hour_weekday', type: 'decimal', precision: 10, scale: 2, nullable: true })
    ratePerHourWeekday?: number | null;

    @Column({ name: 'rate_per_hour_weekend', type: 'decimal', precision: 10, scale: 2, nullable: true })
    ratePerHourWeekend?: number | null;

    @Column({ name: 'rate_per_hour_holiday', type: 'decimal', precision: 10, scale: 2, nullable: true })
    ratePerHourHoliday?: number | null;

    @Column({ name: 'subscription_rate_1_month', type: 'decimal', precision: 10, scale: 2, nullable: true })
    subscriptionRate1Month?: number | null;

    @Column({ name: 'subscription_rate_3_months', type: 'decimal', precision: 10, scale: 2, nullable: true })
    subscriptionRate3Months?: number | null;

    @Column({ name: 'subscription_rate_6_months', type: 'decimal', precision: 10, scale: 2, nullable: true })
    subscriptionRate6Months?: number | null;

    @Column({ name: 'education', type: 'text', nullable: true })
    education?: string | null;

    @Column({ name: 'years_of_experience', type: 'int', nullable: true })
    yearsOfExperience?: number | null;

    @Column({ name: 'bio', type: 'text', nullable: true })
    bio?: string | null;

    @OneToMany(() => ProviderCategory, (pc) => pc.providerProfessionalDetails)
    categoryLinks!: ProviderCategory[];

    @OneToMany(() => ProviderSkill, (ps) => ps.providerProfessionalDetails)
    skillLinks!: ProviderSkill[];

    @OneToMany(() => ProviderMedia, (m) => m.providerProfessionalDetails)
    media!: ProviderMedia[];
}
