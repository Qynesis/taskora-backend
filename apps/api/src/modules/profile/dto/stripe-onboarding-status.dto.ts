import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StripeOnboardingState } from '../../../database/common/stripe-onboarding-state';

export class StripeOnboardingStatusDto {
  @ApiProperty({ description: 'Shorthand for state === "enabled" — charges and payouts both live' })
  onboarded!: boolean;

  @ApiProperty({
    enum: ['not_started', 'pending', 'action_required', 'enabled'],
    description:
      'not_started: no Stripe account yet. ' +
      'pending: Stripe is verifying, nothing for the provider to do — can take days. ' +
      'action_required: Stripe needs something from the provider; see requirementsDue. ' +
      'enabled: ready to take payments and receive payouts.',
  })
  state!: StripeOnboardingState;

  @ApiProperty()
  chargesEnabled!: boolean;

  @ApiProperty()
  payoutsEnabled!: boolean;

  @ApiProperty({
    type: [String],
    example: ['individual.verification.document', 'external_account'],
    description:
      'Stripe requirement keys still outstanding. Empty unless state is action_required. ' +
      'Send the provider to POST /me/stripe/onboarding-link to supply them.',
  })
  requirementsDue!: string[];

  @ApiPropertyOptional({
    nullable: true,
    example: 'requirements.past_due',
    description: "Stripe's reason the account is restricted, when there is one.",
  })
  disabledReason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  onboardingCompletedAt!: Date | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'When requirementsDue/state last came from Stripe. Null on a never-synced account.',
  })
  requirementsSyncedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;
}
