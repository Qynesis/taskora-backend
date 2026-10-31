import * as dotenv from 'dotenv';
import * as path from 'path';

// Set required environment variables before any module is loaded during tests.
// This prevents the Joi config validation schema (env.validation.ts) and the
// AES encryption util (encryption.util.ts) from throwing at import time.

// Load environment files before applying fallbacks.
// Precedence: shell env > .env.test > .env > fallback values below.
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

process.env.DB_ENCRYPTION_KEY ??= '0'.repeat(64);

// ── App ──────────────────────────────────────────────────────────────────────
process.env.NODE_ENV ??= 'test';

// ── Database ─────────────────────────────────────────────────────────────────
process.env.DB_HOST ??= 'localhost';
process.env.DB_USERNAME ??= 'test';
process.env.DB_PASSWORD ??= 'test';
process.env.DB_NAME ??= 'test';

// ── Redis ─────────────────────────────────────────────────────────────────────
process.env.REDIS_HOST ??= 'localhost';

// ── Auth ──────────────────────────────────────────────────────────────────────
// Bypass Supabase requirement so SUPABASE_URL / SUPABASE_ANON_KEY are not needed
process.env.AUTH_BYPASS ??= 'true';

// ── Azure Storage ─────────────────────────────────────────────────────────────
process.env.AZURE_STORAGE_CONNECTION_STRING ??= 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net';

// ── Stripe ────────────────────────────────────────────────────────────────────
process.env.STRIPE_SEC_KEY ??= 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET ??= 'whsec_placeholder';

// ── SMS (Esendex) ─────────────────────────────────────────────────────────────
process.env.ESENDEX_ACCOUNT_REF ??= 'EX0000000';
process.env.ESENDEX_USERNAME ??= 'test@example.com';
process.env.ESENDEX_PASSWORD ??= 'test-password';
process.env.ESENDEX_ORIGINATOR ??= 'Taskora';

// ── Email (Resend) ────────────────────────────────────────────────────────────
process.env.RESEND_API_KEY ??= 're_test_placeholder';
