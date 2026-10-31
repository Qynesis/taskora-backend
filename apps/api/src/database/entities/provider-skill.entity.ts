import { Entity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Skill } from './skill.entity';
import { ProviderProfessionalDetails } from './provider_professional_details.entity';

@Entity('provider_skills')
@Unique(['providerProfessionalDetails', 'skill'])
export class ProviderSkill extends BaseEntity {
    @ManyToOne(() => ProviderProfessionalDetails, (pd) => pd.skillLinks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'profile_id', referencedColumnName: 'profileId' })
    providerProfessionalDetails!: ProviderProfessionalDetails;

    @ManyToOne(() => Skill, (s) => s.providerLinks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'skill_id' })
    skill!: Skill;
}
