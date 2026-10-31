import { Entity, Column, Unique, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { ProviderCategory } from './provider-category.entity';
import { Job } from './job.entity';
import { CategoryAsset } from './category-asset.entity';

@Entity({ name: 'categories', schema: 'service' })
@Unique(['name'])
export class Category extends BaseEntity {

    @Column({ name: 'name', type: 'varchar', length: 120 })
    name!: string;

    @Column({ name: 'marketing_service_list', type: 'text', nullable: true })
    marketingServiceList?: string;

    @Column({ name: 'icon_url', type: 'varchar', length: 500, nullable: true })
    iconUrl?: string;

    @Column({ name: 'mcc', type: 'varchar', length: 10, nullable: true })
    mcc?: string | null;

    @OneToMany(() => ProviderCategory, (pc) => pc.category)
    providerLinks!: ProviderCategory[];

    @OneToMany(() => Job, (j) => j.category)
    jobs!: Job[];

    @OneToMany(() => CategoryAsset, (asset) => asset.category)
    assets!: CategoryAsset[];
}