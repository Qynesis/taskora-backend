# Flow Spec: Reviews and Audit Trail

## Goal
Capture quality feedback flow and system-of-record audit logging behavior.

## Review Flow
1. Seeker submits review bound to a job.
2. Service validates:
- job exists
- requester is job seeker
- job status is `completed`
- selected provider exists
- no existing review for that job
3. Review is persisted and becomes part of provider history.

## Audit Flow
1. Services call audit logger with action + entity + optional actor + metadata.
2. Audit logs are append-only and queryable through admin surfaces.

## Invariants
1. One review per job.
2. Audit entries are immutable after creation.

## Related Tables
- `reviews`
- `audit_logs`
