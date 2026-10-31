import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the unused `subscription_periods` table. The entity was never injected, queried, related to,
 * or maintained by any trigger — per-cycle data lives on `transactions`. The live "period" endpoint
 * (GET /subscriptions/{jobId}/period) reads directly from Stripe and does not touch this table.
 */
export class DropSubscriptionPeriods1777467275539 implements MigrationInterface {
  name = 'DropSubscriptionPeriods1777467275539';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "service"."subscription_periods"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreates the table structure only (data is not recoverable), matching the original schema.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service"."subscription_periods" (
        "id"                       uuid                       PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at"               timestamptz                NOT NULL DEFAULT now(),
        "updated_at"               timestamptz                NOT NULL DEFAULT now(),
        "deleted_at"               timestamptz,
        "subscription_id"          uuid                       NOT NULL REFERENCES "service"."subscriptions"("id") ON DELETE CASCADE,
        "period_start"             timestamptz                NOT NULL,
        "period_end"               timestamptz                NOT NULL,
        "stripe_invoice_id"        varchar(255)               UNIQUE,
        "stripe_payment_intent_id" varchar(255),
        "stripe_charge_id"         varchar(255),
        "stripe_transfer_id"       varchar(255),
        "amount_total"             int                        NOT NULL,
        "tax_gst_amount"           int                        NOT NULL DEFAULT 0,
        "platform_fee"             int                        NOT NULL DEFAULT 0,
        "provider_amount"          int                        NOT NULL DEFAULT 0,
        "currency"                 char(3)                    NOT NULL DEFAULT 'AUD',
        "payment_status"           "service"."payment_status" NOT NULL DEFAULT 'pending'
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_subscription_periods_subscription_id" ON "service"."subscription_periods" ("subscription_id")`);
  }
}
