import { Entity, OneToOne, JoinColumn, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { User } from './user.entity';

@Entity('stripe_customers')
@Unique(['customerId'])
@Unique(['seeker'])
export class StripeCustomer extends BaseEntity {
    @OneToOne(() => User, (u) => u.stripeCustomer, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'seeker_user_id' })
    seeker!: User;

    @Column({ name: 'customer_id', type: 'varchar', length: 255 })
    @Index({ unique: true })
    customerId!: string;
}