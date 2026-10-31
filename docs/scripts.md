# Utility Scripts

All scripts live in `scripts/` and are run with Node.js directly. They load `.env` from the project root automatically — no manual `export` needed.

---

## db-setup.mjs

Sets up the database from your local machine. Handles the `service` schema creation before migrations (TypeORM requires the schema to exist before it creates its own `migrations` table).

```bash
node scripts/db-setup.mjs migrate        # create schema + run pending migrations
node scripts/db-setup.mjs seed           # run seed data only
node scripts/db-setup.mjs migrate seed   # both in order
```

**Requires:** SSH tunnel active if targeting a remote database.

```bash
# Open tunnel first (keep this terminal open)
ssh -L 5432:<remote-db-host>:5432 <user>@<server-ip> -N

# Then set in .env:
# DB_HOST=localhost
# DB_PORT=5432
```

---

## upload-category-icons.mjs

Uploads PNG icons from `scripts/files/categories/` to Azure Blob Storage (public container, `categories/` folder) and updates the `icon_url` column in `service.categories`.

Matching logic:
1. Manual map overrides for filenames that don't match category names directly (see `MANUAL_MAP` in the script).
2. Exact case-insensitive match on filename stem vs `categories.name`.

The script is **idempotent** — re-running it replaces the existing blob and updates the DB with the same URL.

```bash
node scripts/upload-category-icons.mjs             # upload + update DB
node scripts/upload-category-icons.mjs --dry-run   # preview matches and blob URLs only
```

**Requires:** SSH tunnel active for DB access. Azure connection string in `.env`.

**Relevant `.env` vars:**
- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_STORAGE_PUBLIC_CONTAINER` — target container name

---

## approve-all.mjs

Admin convenience script that bulk-approves all pending provider verification steps and certifications via the REST API. Intended for development and testing environments to quickly get providers past KYC.

```bash
node scripts/approve-all.mjs <ADMIN_JWT_TOKEN>
node scripts/approve-all.mjs <ADMIN_JWT_TOKEN> --dry-run   # preview only
# Or via env var:
ADMIN_TOKEN=<token> node scripts/approve-all.mjs
```

**What it does:**
1. Fetches all providers with pending verification submissions.
2. Approves each verification step that is not yet `approved`.
3. Fetches all providers and approves any `pending` certifications.

**Requires:** A valid admin JWT token. The API must be running and reachable. `API_BASE_URL` can be set in `.env` to override the default target.

> Do not use in production with real providers — this bypasses the human review process.

---

## seed-provider-profile.mjs

Fully seeds a provider's profile through the REST API: personal info, work info, bank details, professional details, employees, certifications, and verification steps. Intended for populating test/staging environments quickly.

```bash
node scripts/seed-provider-profile.mjs <PROVIDER_JWT_TOKEN>
# Or:
PROVIDER_TOKEN=<token> node scripts/seed-provider-profile.mjs
```

**File dependencies** (place real files here before running):

```
scripts/files/
├── profile/
│   ├── avatar.png
│   ├── portfolio-1.png
│   ├── portfolio-2.png
│   └── employee.jpg
└── verification/
    ├── identity.png
    ├── police.pdf
    └── rtw.pdf
```

Missing files are skipped with a warning — the script continues without them.

**Edit the constants at the top of the script** (`PERSONAL_INFO`, `WORK_INFO`, `BANK_DETAILS`, etc.) to change the seeded data before running.

**Requires:** The API must be running. Provider token must belong to a user with `PROVIDER` role.

---

## delete-user.mjs

Hard-deletes a user and all their related data from the database, respecting FK constraint order. Runs as a dry-run by default to show row counts before any changes are made.

```bash
node scripts/delete-user.mjs <USER_ID>            # dry-run (safe, shows counts only)
node scripts/delete-user.mjs <USER_ID> --confirm  # actually deletes
```

**Deletion order** (to satisfy FK constraints):
1. Transactions
2. Refund requests + evidence photos (cascade)
3. Refunds
4. Payments
5. Messages and direct messages
6. User reports
7. Bids
8. Subscriptions + periods + cancellation requests (cascade)
9. Jobs + bids, photos, contracts, cancellations, selections (all cascade from job)
10. User record + profile, stripe_customer, conversations, warnings, notifications, saved cards, favourites, reviews (all cascade from user)

**Requires:** Direct DB access (reads credentials from `.env`). Use SSH tunnel for remote databases.

> This is irreversible. Always run without `--confirm` first to review what will be deleted.
