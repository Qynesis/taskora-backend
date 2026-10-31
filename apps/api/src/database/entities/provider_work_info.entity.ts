import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Profile } from './profile.entity';
import { BaseEntity } from '../common/base.entity';

@Entity('provider_work_info')
export class ProviderWorkInfo extends BaseEntity {
    @PrimaryColumn({ name: 'profile_id', type: 'uuid' })
    profileId!: string;

    @OneToOne(() => Profile, (p) => p.workInfo, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'profile_id' })
    profile!: Profile;

    @Column({ name: 'business_name', type: 'varchar', length: 200 })
    businessName!: string;

    @Column({ name: 'abn', type: 'varchar', length: 20 })
    abn!: string;

    @Column({ name: 'acn', type: 'varchar', length: 20, nullable: true })
    acn?: string | null;
}
