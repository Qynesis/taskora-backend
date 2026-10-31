import { Entity, Column, DeleteDateColumn, Index, Unique, OneToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { UserRole } from '../common/enum';
import { Profile } from './profile.entity';
import { Job } from './job.entity';
import { Bid } from './bid.entity';
import { Selection } from './selection.entity';
import { Conversation } from './conversation.entity';
import { StripeAccount } from './stripe-account.entity';
import { StripeCustomer } from './stripe-customer.entity';
import { Subscription } from './subscription.entity';
import { Payment } from './payment.entity';
import { AuditLog } from './audit-log.entity';
import { UserWarning } from './user-warning.entity';

@Entity('users')
@Unique(['email'])
export class User extends BaseEntity {
    @Column({ name: 'email', type: 'varchar', length: 320 })
    @Index()
    email!: string;

    @Column({ name: 'role', type: 'enum', enum: UserRole, enumName: 'user_role', default: UserRole.SEEKER })
    role!: UserRole;

    @Column({ name: 'email_verified', type: 'boolean', default: false })
    emailVerified!: boolean;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ name: 'is_suspended', type: 'boolean', default: false })
    isSuspended!: boolean;

    @Column({ name: 'suspended_at', type: 'timestamptz', nullable: true })
    suspendedAt?: Date | null;

    // Admin suspend() soft-deletes the row (UsersService.suspend -> softDelete), which hides the
    // user from every query that does not pass withDeleted. This is the only soft delete in the
    // schema, which is why it is declared here rather than inherited from BaseEntity.
    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt!: Date | null;

    // User-initiated account deletion marker (GDPR / Play Store). Distinct from the admin
    // isActive/isSuspended moderation flags and from deletedAt above (used by suspend()).
    // When set, the account is permanently deleted + anonymized; login is blocked by the auth gate.
    @Column({ name: 'account_deleted_at', type: 'timestamptz', nullable: true })
    accountDeletedAt?: Date | null;

    @OneToOne(() => Profile, (p) => p.user)
    profile?: Profile;

    @OneToMany(() => Job, (j) => j.seeker)
    jobs!: Job[];

    @OneToMany(() => Job, (j) => j.provider)
    jobsAsProvider!: Job[];

    @OneToMany(() => Bid, (b) => b.provider)
    bids!: Bid[];

    @OneToMany(() => Selection, (s) => s.provider)
    selectionsAsProvider!: Selection[];

    @OneToMany(() => Selection, (s) => s.selectedBy)
    selectionsMade!: Selection[];

    @OneToMany(() => Conversation, (c) => c.seeker)
    conversationsAsSeeker!: Conversation[];

    @OneToMany(() => Conversation, (c) => c.provider)
    conversationsAsProvider!: Conversation[];

    @OneToOne(() => StripeAccount, (a) => a.provider, { cascade: true })
    stripeAccount?: StripeAccount;

    @OneToOne(() => StripeCustomer, (c) => c.seeker, { cascade: true })
    stripeCustomer?: StripeCustomer;

    @OneToMany(() => Subscription, (s) => s.seeker)
    subscriptionsAsSeeker!: Subscription[];

    @OneToMany(() => Subscription, (s) => s.provider)
    subscriptionsAsProvider!: Subscription[];

    @OneToMany(() => Payment, (p) => p.seeker)
    paymentsAsSeeker!: Payment[];

    @OneToMany(() => Payment, (p) => p.provider)
    paymentsAsProvider!: Payment[];

    @OneToMany(() => AuditLog, (a) => a.actor)
    auditLogs!: AuditLog[];

    @OneToMany(() => UserWarning, (w) => w.recipient)
    warnings!: UserWarning[];
}