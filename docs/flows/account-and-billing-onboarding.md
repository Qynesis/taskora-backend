# Flow Spec: Account, Profile, and Billing Onboarding

## Goal
Describe how a user progresses from auth sync to operational readiness for posting/paying or providing services.

## User Sync and Account State
1. Authenticated identity is upserted into local `users` table.
2. Existing records are updated for email/email-verified drift.
3. Admin actions can deactivate/reactivate/suspend users.

## Provider Readiness Track
1. Create basic profile.
2. Save professional details (rates, categories, skills, media).
3. Save work info and bank details.
4. Manage certifications.
5. Complete verification steps (see provider onboarding doc).

## Seeker Billing Readiness
1. Create Stripe customer mapping (requires profile).
2. Retrieve billing customer status from Stripe.
3. Save payment method during checkout if requested.

## Subscription Operations
1. Create subscription checkout session from stripe customer + price.
2. Query subscription details and current period.
3. Cancel subscription with reason.

## Cross-Module Invariants
1. Billing customer creation should be one-to-one per seeker.
2. Provider profile completeness gates bidding.
3. Suspended users are soft-deleted and marked inactive.
