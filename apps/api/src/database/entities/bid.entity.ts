import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { numericTransformer } from '../common/numeric.transformer';
import { Job } from './job.entity';
import { User } from './user.entity';
import { BidStatus } from '../common/enum';

@Entity('bids')
@Index(['job', 'status'])
export class Bid extends BaseEntity {
    @ManyToOne(() => Job, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'job_id' })
    @Index()
    job!: Job;

    @ManyToOne(() => User, (u) => u.bids, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'provider_user_id' })
    @Index()
    provider!: User;

    @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2, transformer: numericTransformer })
    price!: number;

    @Column({ name: 'currency', type: 'char', length: 3, default: 'AUD' })
    currency!: string;

    @Column({ name: 'status', type: 'enum', enum: BidStatus, enumName: 'bid_status', default: BidStatus.SUBMITTED })
    @Index()
    status!: BidStatus;
}