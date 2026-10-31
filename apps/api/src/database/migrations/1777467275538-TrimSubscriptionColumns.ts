import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Trims the over-modeled `subscriptions` table down to a Stripe subscription "header".
 *
 * Removed columns duplicated other sources of truth:
 *   - engagement / billing / duration_months → live on `jobs`
 *   - application_fee / application_fee_percent → the realized fee ledger lives on `transactions`
 *   - connect_charge_type / gst_inclusive → dead constants, never read
 *
 * This migration only changes the schema. Backfilling the kept columns for existing rows (which
 * were never populated — the row used to be a write-once INCOMPLETE placeholder) is handled by
 * `apps/api/src/scripts/backfill-subscriptions.ts`. The backfill reads from `transactions` /
 * `audit_logs` / Stripe and writes only to KEPT columns, so it is independent of this drop and can
 * be run before or after it.
 */
export class TrimSubscriptionColumns1777467275538 implements MigrationInterface {
  name = 'TrimSubscriptionColumns1777467275538';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the redundant / dead columns. (Data backfill lives in the standalone script.)
    await queryRunner.query(`
      ALTER TABLE "service"."subscriptions"
        DROP COLUMN IF EXISTS "engagement",
        DROP COLUMN IF EXISTS "billing",
        DROP COLUMN IF EXISTS "duration_months",
        DROP COLUMN IF EXISTS "connect_charge_type",
        DROP COLUMN IF EXISTS "application_fee",
        DROP COLUMN IF EXISTS "application_fee_percent",
        DROP COLUMN IF EXISTS "gst_inclusive"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restores structure only — the dropped data is not recoverable. engagement/billing are
    // re-added nullable (they were NOT NULL originally) so the rollback cannot fail on existing rows.
    await queryRunner.query(`
      ALTER TABLE "service"."subscriptions"
        ADD COLUMN IF NOT EXISTS "engagement"              "service"."engagement_type" NULL,
        ADD COLUMN IF NOT EXISTS "billing"                 "service"."billing_type"    NULL,
        ADD COLUMN IF NOT EXISTS "duration_months"         integer                     NULL,
        ADD COLUMN IF NOT EXISTS "connect_charge_type"     "service"."connect_flow"    NOT NULL DEFAULT 'destination',
        ADD COLUMN IF NOT EXISTS "application_fee"         numeric(10,2)               NULL,
        ADD COLUMN IF NOT EXISTS "application_fee_percent" numeric(6,3)                NULL,
        ADD COLUMN IF NOT EXISTS "gst_inclusive"           boolean                     NOT NULL DEFAULT true
    `);
  }
}
