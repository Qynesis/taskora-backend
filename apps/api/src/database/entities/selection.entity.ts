import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne, CreateDateColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Job } from './job.entity';
import { Bid } from './bid.entity';
import { User } from './user.entity';

@Entity('selections')
@Unique(['job'])
export class Selection extends BaseEntity {
    @OneToOne(() => Job, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'job_id' })
    job!: Job;

    @ManyToOne(() => Bid, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'bid_id' })
    @Index()
    bid!: Bid;

    @ManyToOne(() => User, (u) => u.selectionsAsProvider, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'provider_user_id' })
    @Index()
    provider!: User;

    @ManyToOne(() => User, (u) => u.selectionsMade, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'selected_by_user_id' })
    @Index()
    selectedBy!: User; // seeker
}