# Environment Variables Specification

Copy `.env.example` (or create `.env`) and set the variables below. They are grouped by
area. "Required" means the related feature will not work without it in a real deployment;
variables with a default can be omitted for local development.

## Core / Runtime
| Variable | Default | Purpose |
|---|---|---|
| NODE_ENV | `development` | Runtime environment |
| PORT | `3000` | HTTP port |
| API_PREFIX | `api` | Global route prefix |
| CORS_ORIGINS | empty (allow all) | Comma-separated allowed origins |
| CORS_CREDENTIALS | `true` | Allow credentialed CORS requests |
| SWAGGER_ENABLED | `false` | Serve the Swagger API docs UI |
| LOG_LEVEL | `info` | Log verbosity |
| LOG_PRETTY | `false` | Pretty-print logs (dev) |
| WORKER_HEALTH_PORT | `3001` | Health port for the worker process |

## Database (PostgreSQL) — Required
| Variable | Required | Default | Purpose |
|---|---|---|---|
| DB_HOST | Yes | `localhost` | PostgreSQL host |
| DB_PORT | No | `5432` | PostgreSQL port |
| DB_USERNAME | Yes | `postgres` | PostgreSQL username |
| DB_PASSWORD | Yes | `postgres` | PostgreSQL password |
| DB_NAME | Yes | `app` | Database name (schema: `service`) |
| DB_SSL | No | `false` | Enable SSL (`true` outside local dev) |
| DB_SYNCHRONIZE | No | `false` | TypeORM auto-sync — keep `false`; use migrations |
| DB_LOG_QUERIES | No | `false` | Log SQL queries |
| DB_ENCRYPTION_KEY | Yes | — | 64-char hex (32 bytes) — AES-256-GCM key for bank-details encryption |

## Redis — cache & queues — Required
| Variable | Required | Default | Purpose |
|---|---|---|---|
| REDIS_HOST | Yes | `localhost` | Redis host |
| REDIS_PORT | No | `6379` | Redis port |
| REDIS_PASSWORD | No | empty | Redis password |
| CACHE_DEFAULT_TTL | No | `60` | Default cache TTL (seconds) |
| CACHE_MAX_ITEMS | No | `1000` | Max in-memory cache items |
| QUEUE_DEFAULT_ATTEMPTS | No | `3` | BullMQ job retry attempts |
| QUEUE_DEFAULT_BACKOFF | No | `5000` | BullMQ retry backoff (ms) |

## Authentication (Supabase) — Required unless AUTH_BYPASS=true
| Variable | Required | Default | Purpose |
|---|---|---|---|
| SUPABASE_URL | Conditional | — | Supabase project URL |
| SUPABASE_ANON_KEY | Conditional | — | Supabase anon key (token verification) |
| SUPABASE_SERVICE_ROLE_KEY | Conditional | — | Supabase service-role key (admin user operations, e.g. auth-user deletion) |
| AUTH_BYPASS | No | `false` | Dev-only auth bypass — **never `true`** in shared/staging/prod |

## File Storage (Azure Blob) — Required
| Variable | Required | Default | Purpose |
|---|---|---|---|
| AZURE_STORAGE_CONNECTION_STRING | Yes | — | Azure Blob Storage connection string |
| AZURE_STORAGE_PUBLIC_CONTAINER | No | `serviceapp-public` | Public container (avatars, category icons) |
| AZURE_STORAGE_PRIVATE_CONTAINER | No | `serviceapp-private` | Private container (ID documents, verification files) |

Both containers must exist in the storage account. Note: env validation defaults to
`serviceapp-public` / `serviceapp-private`, while the config fallback (when validation is
skipped) is `uploads-public` / `uploads-private` — set both explicitly to avoid ambiguity.

## Payments (Stripe) — Required
| Variable | Required | Default | Purpose |
|---|---|---|---|
| STRIPE_SEC_KEY | Yes | — | Stripe secret key |
| STRIPE_WEBHOOK_SECRET | Yes | — | Signing secret for the **"Your account"** webhook endpoint (payments, refunds, subscriptions) |
| STRIPE_WEBHOOK_SECRET_CONNECT | Yes | — | Signing secret for the **"Connected accounts"** webhook endpoint (provider `account.updated`) |
| STRIPE_API_VERSION | No | `2026-04-22.dahlia` | Pinned Stripe API version |
| STRIPE_TEST_CLOCK_ENABLED | No | `false` | Test-mode subscription test clocks — **never `true`** in live |
| PLATFORM_URL | No | `https://taskoraservices.com.au` | Base platform URL (Stripe business profile / links) |

Hosted-flow redirect URLs (localhost defaults are for dev; set real URLs in deployment):
| Variable | Default |
|---|---|
| STRIPE_CHECKOUT_SUCCESS_URL | `http://localhost:3000/checkout/success` |
| STRIPE_CHECKOUT_CANCEL_URL | `http://localhost:3000/checkout/cancel` |
| STRIPE_CARD_SUCCESS_URL | `http://localhost:3000/cards?added=true` |
| STRIPE_CARD_CANCEL_URL | `http://localhost:3000/cards` |
| STRIPE_CONNECT_RETURN_URL | `<PLATFORM_URL>/provider/onboarding/complete` |
| STRIPE_CONNECT_REFRESH_URL | `<PLATFORM_URL>/provider/onboarding/refresh` |

## Email (Resend) — Required for transactional/contact email
| Variable | Required | Default | Purpose |
|---|---|---|---|
| RESEND_API_KEY | Yes | — | Resend API key |
| RESEND_FROM_ADDRESS | No | `noreply@taskoraservices.com.au` | Default "from" address |
| CONTACT_TO_EMAIL | No | `contact@taskoraservices.com.au` | Recipient for contact-form submissions |

## Push Notifications (Firebase Cloud Messaging) — Required for push
| Variable | Required | Purpose |
|---|---|---|
| FCM_PROJECT_ID | Yes | Firebase project ID |
| FCM_CLIENT_EMAIL | Yes | Service-account client email |
| FCM_PRIVATE_KEY | Yes | Service-account private key (escape newlines as `\n`) |

## SMS / OTP (Esendex) — Required for SMS
| Variable | Required | Purpose |
|---|---|---|
| ESENDEX_USERNAME | Yes | Esendex username |
| ESENDEX_PASSWORD | Yes | Esendex password |
| ESENDEX_ACCOUNT_REF | Yes | Esendex account reference |
| ESENDEX_ORIGINATOR | Yes | Sender ID / originator |

## Legacy / Optional
These are read by the legacy JWT auth strategy and are **not required** when Supabase auth
is active (the default). They exist only for the alternate auth path and fall back to
placeholder values if unset: `JWT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`JWT_ACCESS_EXPIRY` (`15m`), `JWT_REFRESH_EXPIRY` (`30d`), `JWT_EXPIRATION` (`1h`).

## Namespace Mapping in Config Module
- `app`: runtime basics (port, prefix, environment, CORS)
- `database`: DB connection, schema, encryption key
- `redis` / `cache` / `queue`: cache and background-job backing store
- `auth` / `supabase`: auth strategy toggles and Supabase credentials
- `azureStorage`: blob containers and connection
- `stripe`: keys, API version, webhook secrets, redirect URLs
- `resend`: transactional email
- `fcm`: push notifications
- `esendex`: SMS

## Operational Notes
1. Keep `AUTH_BYPASS=false` in any shared/staging/production deployment.
2. Configure **both** Stripe webhook endpoints and set their matching secrets
   (`STRIPE_WEBHOOK_SECRET` for "Your account", `STRIPE_WEBHOOK_SECRET_CONNECT` for
   "Connected accounts") — provider status updates depend on the Connect endpoint.
3. Keep `STRIPE_TEST_CLOCK_ENABLED=false` in live.
4. Prefer explicit `DB_SSL=true` outside local development.
5. `DB_ENCRYPTION_KEY` must be a stable 64-character hex string; changing it makes
   previously encrypted bank details unreadable.
