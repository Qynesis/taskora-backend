import { Entity, OneToOne, JoinColumn, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { StripeOnboardingState } from '../common/stripe-onboarding-state';
import { User } from './user.entity';

@Entity('stripe_accounts')
@Unique(['accountId'])
@Unique(['provider'])
export class StripeAccount extends BaseEntity {
    @OneToOne(() => User, (u) => u.stripeAccount, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'provider_user_id' })
    provider!: User;

    @Column({ name: 'account_id', type: 'varchar', length: 255 })
    @Index({ unique: true })
    accountId!: string;

    @Column({ name: 'details_submitted', type: 'boolean', default: false })
    detailsSubmitted!: boolean;

    @Column({ name: 'charges_enabled', type: 'boolean', default: false })
    chargesEnabled!: boolean;

    @Column({ name: 'payouts_enabled', type: 'boolean', default: false })
    payoutsEnabled!: boolean;

    @Column({ name: 'onboarding_completed_at', type: 'timestamptz', nullable: true })
    onboardingCompletedAt?: Date | null;

    // Last payout status we notified the provider about ('enabled' | 'action_required'), used to
    // dedup account.updated notifications so we notify once per meaningful change, not per webhook.
    @Column({ name: 'last_notified_status', type: 'varchar', length: 32, nullable: true })
    lastNotifiedStatus?: string | null;

    // Provider-facing onboarding state, refreshed from every account.updated event. Distinct from
    // lastNotifiedStatus, which tracks what we last *told* them: this is what /status *shows*.
    @Column({ name: 'onboarding_state', type: 'varchar', length: 20, default: 'pending' })
    onboardingState!: StripeOnboardingState;

    // Stripe's currently_due + past_due at the last sync — what the provider still has to supply.
    @Column({ name: 'requirements_due', type: 'jsonb', default: () => `'[]'::jsonb` })
    requirementsDue!: string[];

    @Column({ name: 'disabled_reason', type: 'varchar', length: 100, nullable: true })
    disabledReason?: string | null;

    // When the three fields above last came from Stripe. Null means never synced, which lets
    // /status fall back to a live fetch rather than serve a state it never actually received.
    @Column({ name: 'requirements_synced_at', type: 'timestamptz', nullable: true })
    requirementsSyncedAt?: Date | null;
}