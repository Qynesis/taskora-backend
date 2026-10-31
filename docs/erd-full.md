# Full Database ERD

To keep GitHub rendering readable, the full schema is split into domain ERDs generated from **entity relations** (not migration DDL):

1. [erd-provider-profile.md](erd-provider-profile.md)
2. [erd-marketplace.md](erd-marketplace.md)
3. [erd-finance.md](erd-finance.md)
4. [erd-engagement.md](erd-engagement.md)

## Full Table Inventory (Current Entity Set)
- `audit_logs`
- `bids`
- `categories`
- `conversations`
- `direct_messages`
- `fcm_tokens`
- `job_cancellations`
- `job_contracts`
- `job_photos`
- `jobs`
- `notifications`
- `payments`
- `platform_fee_configs`
- `profiles`
- `provider_bank_details`
- `provider_certifications`
- `provider_employees`
- `provider_media`
- `provider_professional_details`
- `provider_profiles`
- `provider_verification_cases`
- `provider_verification_step_files`
- `provider_verification_steps`
- `provider_work_info`
- `provider_categories`
- `provider_skills`
- `refund_evidence_photos`
- `refund_requests`
- `refunds`
- `reviews`
- `saved_payment_methods`
- `seeker_favourite_providers`
- `selections`
- `skills`
- `stripe_accounts`
- `stripe_customers`
- `subscription_cancellation_requests`
- `subscription_periods`
- `subscriptions`
- `support_messages`
- `support_tickets`
- `transactions`
- `user_notification_settings`
- `user_reports`
- `user_warnings`
- `users`
- `warning_messages`
- `warning_threads`

## Notes
- Source of truth for relationships: TypeORM decorators in `apps/api/src/database/entities/`.
- Migration files remain the source of truth for exact DDL details (constraints/indexes/default SQL).
