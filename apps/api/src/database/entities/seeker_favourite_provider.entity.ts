import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';
import { Profile } from './profile.entity';

@Entity('seeker_favourite_providers')
@Unique(['seekerUserId', 'providerProfileId'])
export class SeekerFavouriteProvider extends BaseEntity {
    @Column({ name: 'seeker_user_id', type: 'uuid' })
    seekerUserId!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'seeker_user_id' })
    seeker!: User;

    @Column({ name: 'provider_profile_id', type: 'uuid' })
    providerProfileId!: string;

    @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'provider_profile_id' })
    providerProfile!: Profile;
}
