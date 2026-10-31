# Technical Specs Index

This folder complements Swagger by documenting architecture intent, data semantics, and operational flows.

## Documents
- [architecture.md](architecture.md): system context, design decisions, integration boundaries.
- [local-development.md](local-development.md): prerequisites, local setup, SSH tunnel, migrations, testing.
- [deployment.md](deployment.md): Docker build, docker-compose, Azure VM, Nginx, pushing updates.
- [scripts.md](scripts.md): all utility scripts — db-setup, upload-icons, approve-all, seed-provider, delete-user.
- [domain-model.md](domain-model.md): core ERD, constraints, enums, and rule anchors.
- [erd-full.md](erd-full.md): full schema ERD hub with table inventory and split views.
- [erd-provider-profile.md](erd-provider-profile.md): provider profile and verification ERD.
- [erd-marketplace.md](erd-marketplace.md): marketplace jobs, bids, selection, review ERD.
- [erd-finance.md](erd-finance.md): subscriptions, payments, refunds, transactions ERD (includes invoice + credit note fields).
- [erd-engagement.md](erd-engagement.md): conversation, moderation, support, notification ERD.
- [class-diagram.md](class-diagram.md): high-level class relationships across domain and services.
- [use-case-diagram.md](use-case-diagram.md): actor-to-use-case view of platform behavior.
- [data-flow-diagram.md](data-flow-diagram.md): system data movement and storage flow.
- [access-control.md](access-control.md): authn/authz model and storage security behaviors.
- [environment-variables.md](environment-variables.md): required vars, defaults, and runtime notes.
- [module-specs.md](module-specs.md): module-by-module ownership, webhook routing, and known gaps.

## Flow Specs
- [flows/job-lifecycle.md](flows/job-lifecycle.md)
- [flows/payment-flow.md](flows/payment-flow.md)
- [flows/provider-onboarding.md](flows/provider-onboarding.md)
- [flows/bidding-and-selection.md](flows/bidding-and-selection.md)
- [flows/direct-booking-flow.md](flows/direct-booking-flow.md)
- [flows/conversation-and-messaging.md](flows/conversation-and-messaging.md)
- [flows/report-warning-moderation.md](flows/report-warning-moderation.md)
- [flows/support-and-admin-reply.md](flows/support-and-admin-reply.md)
- [flows/notification-delivery.md](flows/notification-delivery.md)
- [flows/account-and-billing-onboarding.md](flows/account-and-billing-onboarding.md)
- [flows/review-and-audit.md](flows/review-and-audit.md)
- [flows/reference-data.md](flows/reference-data.md)

## Suggested Review Cadence
1. Update these specs in the same PR whenever endpoint behavior or schema rules change.
2. Review docs in release readiness checks (especially payment and access-control sections).
