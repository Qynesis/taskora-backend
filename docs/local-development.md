# Local Development Guide

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20.x | Use nvm or fnm to manage versions |
| npm | 10.x | Comes with Node 20 |
| PostgreSQL | 14+ | Local or remote via SSH tunnel |
| Redis | 6+ | Local install or Docker |
| Git | any | `git config core.longpaths true` required on Windows |

Optional but helpful:
- Docker Desktop — for running Redis locally or running the full stack
- `psql` CLI — for manual DB inspection

---

## Initial Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd service-app-aus-client
npm install

# 2. Copy and fill environment variables
cp .env.example .env
# Edit .env — minimum required vars are listed in docs/environment-variables.md

# 3. Set up the database (see section below)
node scripts/db-setup.mjs migrate seed
```

---

## Environment Variables

All configuration is driven by `.env` at the project root. See [environment-variables.md](environment-variables.md) for the full reference.

Minimum set needed for local development:

```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=your_db
REDIS_HOST=localhost
REDIS_PORT=6379
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=...
STRIPE_SEC_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
AUTH_BYPASS=true          # skip Supabase JWT validation in local dev
```

> **Never set `AUTH_BYPASS=true` in a shared, staging, or production environment.**

---

## Database Setup

The project uses TypeORM migrations. Migrations and seeding are always run locally — **not** inside Docker containers.

### Option A — Local PostgreSQL

Ensure your local PostgreSQL is running and the credentials in `.env` are correct, then:

```bash
node scripts/db-setup.mjs migrate seed
```

### Option B — Remote database via SSH tunnel

Open an SSH tunnel in a **separate terminal** and keep it running:

```bash
ssh -L 5432:<remote-db-host>:5432 <user>@<server-ip> -N
# Example:
# ssh -L 5432:postgres:5432 azureuser@104.215.196.175 -N
```

Set your local `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
```

Then run:
```bash
node scripts/db-setup.mjs migrate seed
```

The script automatically creates the `service` schema before running migrations (TypeORM requires the schema to exist before it can create its own `migrations` table).

### Creating a new migration

```bash
# Generate migration from entity changes
npm run migration:generate -- -n MigrationName -d apps/api/src/database/data-source.ts

# Check pending migrations
npm run migration:show

# Run
npm run migration:run

# Revert last migration
npm run migration:revert
```

---

## Running the Apps

### API and Worker together (recommended)

```bash
npm run start:all
```

### Individually

```bash
npm run start:api     # API on http://localhost:3000
npm run start:worker  # Worker on http://localhost:3001
```

Both run in watch mode (restarts on file changes).

Swagger UI is available at: **http://localhost:3000/api/docs**

---

## Running Tests

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E smoke tests (requires DB + Redis running)
npm run test:e2e
```

Unit test files are co-located with source files as `*.spec.ts`. Integration/E2E tests live in `apps/api/test/`.

---

## Stripe Webhook Testing (Local)

Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhook events to your local API:

```bash
stripe listen --forward-to http://localhost:3000/api/webhook/stripe
```

This prints a webhook signing secret (`whsec_...`) — set it as `STRIPE_WEBHOOK_SECRET` in `.env`.

Trigger test events:
```bash
stripe trigger payment_intent.succeeded
stripe trigger invoice.paid
```

---

## Project Structure (API app)

```
apps/api/src/
├── config/           # Config namespaces (app, db, redis, stripe, azure, queue, auth)
├── database/
│   ├── entities/     # TypeORM entities
│   ├── migrations/   # Migration files (do not edit after running)
│   └── seed/         # Seed data
├── http/             # Global filters, interceptors, pipes, decorators
├── modules/          # Feature modules (payments, jobs, subscriptions, etc.)
├── security/         # Auth guards and strategies
├── storage/          # Azure Blob upload/read SAS URL generation
├── events/           # Domain event bus
├── cache/            # Cache interceptor and decorators
├── logger/           # Request ID middleware
└── main.ts           # Bootstrap
```

---

## Windows-Specific Notes

- Run `git config core.longpaths true` once to avoid issues with long file paths.
- Use PowerShell or Git Bash — some npm scripts use Unix-style paths.
- If `ts-node` commands fail, ensure `tsconfig-paths` is installed (`npm install` should handle it).
