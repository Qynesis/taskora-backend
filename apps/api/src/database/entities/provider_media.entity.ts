import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { ProviderProfessionalDetails } from './provider_professional_details.entity';

@Entity('provider_media')
export class ProviderMedia extends BaseEntity {
  @ManyToOne(() => ProviderProfessionalDetails, (pd) => pd.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id', referencedColumnName: 'profileId' })
  providerProfessionalDetails!: ProviderProfessionalDetails;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId!: string;

  @Column({ type: 'text' })
  url!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;
}
