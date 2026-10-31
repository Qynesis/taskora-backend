# Service App — Backend

NestJS modular monolith that powers a marketplace connecting seekers (customers) with providers (tradespeople and professionals). Handles job posting, bidding, selection, payments (Stripe Connect), subscriptions, verification (KYC), messaging, and notifications.

---

## Repository Structure

```
service-app-aus-client/
├── apps/
│   ├── api/          # HTTP API — NestJS app (port 3000)
│   └── worker/       # Background worker — BullMQ job processors (port 3001)
├── packages/
│   └── shared-types/ # Shared TS types and queue name constants
├── scripts/          # Utility scripts (migrations, seeding, uploads)
├── docs/             # Architecture, ERDs, flow specs
├── Dockerfile        # Multi-stage build: deps → builder → api → worker
└── docker-compose.yml
```

The API and worker share the same PostgreSQL database and Redis instance. They are deployed as separate Docker containers from the same Dockerfile using build targets.

---

## Tech Stack

| Concern | Technology |
|---|---|
| Runtime | Node.js 20, TypeScript |
| Framework | NestJS 11 (modular monolith) |
| Database | PostgreSQL — schema `service` |
| ORM | TypeORM |
| Auth | Supabase JWT validation |
| Payments | Stripe (Connect destination charges + subscriptions) |
| File Storage | Azure Blob Storage (public + private containers) |
| Queue | BullMQ on Redis |
| Push Notifications | Firebase Cloud Messaging |
| Logger | Pino (structured JSON) |
| Docs | Swagger UI at `/api/docs` (non-production only) |

---

## Quick Start (Local Development)

See **[docs/local-development.md](docs/local-development.md)** for the full guide.

```bash
npm install
cp .env.example .env   # fill in required values
npm run start:api      # API on http://localhost:3000
npm run start:worker   # Worker on http://localhost:3001
```

Swagger UI: http://localhost:3000/api/docs

---

## Database Setup

Migrations and seeding are run locally via an SSH tunnel to the remote database — they are **not** run inside Docker containers.

```bash
# 1. Open SSH tunnel in a separate terminal
ssh -L 5432:<remote-db-host>:5432 <user>@<server-ip> -N

# 2. Run migrations (creates schema + runs all pending migrations)
node scripts/db-setup.mjs migrate

# 3. Seed reference data
node scripts/db-setup.mjs seed

# Or both in one command
node scripts/db-setup.mjs migrate seed
```

---

## Available Scripts

| Script | Purpose |
|---|---|
| `npm run start:api` | Start API in watch mode |
| `npm run start:worker` | Start worker in watch mode |
| `npm run start:all` | Start both concurrently |
| `npm run build` | Compile API + worker |
| `npm run test` | Run all unit tests |
| `npm run test:cov` | Unit tests with coverage |
| `npm run test:e2e` | E2E smoke tests |
| `npm run migration:run` | Run pending TypeORM migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run migration:show` | Show migration status |
| `npm run seed` | Run database seed |
| `npm run db:setup` | `scripts/db-setup.mjs` wrapper |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

See **[docs/scripts.md](docs/scripts.md)** for utility script details.

---

## Deployment

See **[docs/deployment.md](docs/deployment.md)** for the full deployment guide.

The production environment runs on an Azure VM using Docker Compose. The API and worker are built from the same multi-stage Dockerfile and deployed behind an Nginx reverse proxy.

---

## Documentation

| Document | What it covers |
|---|---|
| [docs/architecture.md](docs/architecture.md) | System design, decisions, risks |
| [docs/domain-model.md](docs/domain-model.md) | Core ERD, enums, business rules |
| [docs/erd-finance.md](docs/erd-finance.md) | Payments, refunds, subscriptions schema |
| [docs/erd-marketplace.md](docs/erd-marketplace.md) | Jobs, bids, selections schema |
| [docs/module-specs.md](docs/module-specs.md) | Module ownership and webhook routing |
| [docs/access-control.md](docs/access-control.md) | Auth, roles, storage rules |
| [docs/environment-variables.md](docs/environment-variables.md) | All env vars and defaults |
| [docs/flows/payment-flow.md](docs/flows/payment-flow.md) | Payment, invoice, refund, subscription billing |
| [docs/flows/job-lifecycle.md](docs/flows/job-lifecycle.md) | Job status rail |
| [docs/flows/bidding-and-selection.md](docs/flows/bidding-and-selection.md) | Bid and selection flow |
| [docs/flows/provider-onboarding.md](docs/flows/provider-onboarding.md) | KYC and Stripe Connect readiness |
