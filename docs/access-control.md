# Security and Access Control Specification

## Authentication Model
1. Token-based auth via `JwtAuthGuard` abstraction over pluggable strategy.
2. Active strategy is selected at runtime:
- Supabase token validation in normal mode.
- Dev bypass strategy only when `AUTH_BYPASS=true` and never in production.

## Authorization Model
1. `@Roles(...)` decorator on controllers/endpoints.
2. `RolesGuard` enforces role membership from `request.user.roles`.
3. `PermissionsGuard` supports coarse permission semantics (`READ`, `WRITE`, `DELETE`, `MANAGE`).

## Role Matrix
| Role | Typical capability scope |
|---|---|
| SEEKER | Post jobs, select providers, initiate payments, manage saved cards |
| PROVIDER | Browse jobs, bid, manage verification/profile, check connect status |
| ADMIN | Full console access, moderation, verification review, support/warnings |

## Code-Level Permission Map
- ADMIN: `MANAGE` (implies all)
- PROVIDER: `READ`, `WRITE`
- SEEKER: `READ`

## Storage Access Rules
1. Public folders route to public container
- Current public folders: `profile`, `jobs`, `categories`.
- Files are readable directly by clean blob URL.

2. Private folders route to private container
- Requires read SAS generation for time-bound access.

3. Upload path
- Client requests upload SAS from API.
- Client uploads binary directly to blob.
- API stores clean URL only.

## Rate Limiting
- Global: **100 requests per 60 seconds per IP** (`ThrottlerGuard` applied via `APP_GUARD`).
- Returns HTTP 429 when the limit is exceeded.
- Exemptions (decorated with `@SkipThrottle()`):
  - `WebhookController` — Stripe delivery IPs must not be blocked.
  - `HealthController` — Docker/monitoring probes must not be blocked.

## HTTP Security Headers (Helmet)
`helmet()` middleware is applied at bootstrap before all routes. Sets:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security` (HSTS)
- `X-XSS-Protection`
- `Referrer-Policy`
- and other sensible defaults from the Helmet library.

## Webhook Security
1. Stripe endpoint validates `stripe-signature` using configured webhook secret.
2. Endpoint requires raw body support from Nest bootstrap.
3. Webhook route is excluded from public Swagger listing.
4. Webhook controller is exempt from rate limiting (`@SkipThrottle()`).

## Audit and Traceability
1. Request ID middleware enables per-request tracing.
2. Audit log entities exist for privileged/admin actions and system events.

## Gaps to Track
1. Explicit webhook idempotency guard should be documented and implemented.
2. Security review should validate least-privilege at endpoint level against role matrix.
