import { Entity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Category } from './category.entity';
import { ProviderProfessionalDetails } from './provider_professional_details.entity';

@Entity('provider_categories')
@Unique(['providerProfessionalDetails', 'category'])
export class ProviderCategory extends BaseEntity {
    @ManyToOne(() => ProviderProfessionalDetails, (pd) => pd.categoryLinks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'profile_id', referencedColumnName: 'profileId' })
    providerProfessionalDetails!: ProviderProfessionalDetails;

    @ManyToOne(() => Category, (c) => c.providerLinks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'category_id' })
    category!: Category;
}
