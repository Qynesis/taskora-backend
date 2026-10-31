import { MigrationInterface, QueryRunner } from 'typeorm';

export class AmountsToNumeric1777467275480 implements MigrationInterface {
  name = 'AmountsToNumeric1777467275480';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // payments
    await queryRunner.query(`
      ALTER TABLE "service"."payments"
        ALTER COLUMN "amount"          TYPE numeric(10,2) USING amount::numeric(10,2),
        ALTER COLUMN "tax_gst_amount"  TYPE numeric(10,2) USING tax_gst_amount::numeric(10,2),
        ALTER COLUMN "platform_fee"    TYPE numeric(10,2) USING platform_fee::numeric(10,2),
        ALTER COLUMN "provider_amount" TYPE numeric(10,2) USING provider_amount::numeric(10,2)
    `);

    // refunds
    await queryRunner.query(`
      ALTER TABLE "service"."refunds"
        ALTER COLUMN "amount"                   TYPE numeric(10,2) USING amount::numeric(10,2),
        ALTER COLUMN "application_fee_refunded"  TYPE numeric(10,2) USING application_fee_refunded::numeric(10,2),
        ALTER COLUMN "transfer_reversed_fee"     TYPE numeric(10,2) USING transfer_reversed_fee::numeric(10,2)
    `);

    // platform_fee_configs: cancellation_fee was 1000 (cents) → 10 (dollars)
    await queryRunner.query(`
      ALTER TABLE "service"."platform_fee_configs"
        ALTER COLUMN "cancellation_fee" TYPE numeric(10,2) USING (cancellation_fee::numeric / 100),
        ALTER COLUMN "cancellation_fee" SET DEFAULT 10
    `);

    // refund_requests
    await queryRunner.query(`
      ALTER TABLE "service"."refund_requests"
        ALTER COLUMN "requested_amount" TYPE numeric(10,2) USING requested_amount::numeric(10,2)
    `);

    // transactions: amount was stored as Stripe cents → convert to dollars
    await queryRunner.query(`
      ALTER TABLE "service"."transactions"
        ALTER COLUMN "amount" TYPE numeric(10,2) USING (amount::numeric / 100)
    `);

    // subscription_periods: amounts were stored via fromCents() already in dollars (int truncated)
    await queryRunner.query(`
      ALTER TABLE "service"."subscription_periods"
        ALTER COLUMN "amount_total"    TYPE numeric(10,2) USING amount_total::numeric(10,2),
        ALTER COLUMN "tax_gst_amount"  TYPE numeric(10,2) USING tax_gst_amount::numeric(10,2),
        ALTER COLUMN "platform_fee"    TYPE numeric(10,2) USING platform_fee::numeric(10,2),
        ALTER COLUMN "provider_amount" TYPE numeric(10,2) USING provider_amount::numeric(10,2)
    `);

    // subscriptions: application_fee (if ever populated was in cents)
    await queryRunner.query(`
      ALTER TABLE "service"."subscriptions"
        ALTER COLUMN "application_fee" TYPE numeric(10,2) USING (application_fee::numeric / 100)
    `);

    // jobs: budget_price was stored as whole dollars (int), just widen type
    await queryRunner.query(`
      ALTER TABLE "service"."jobs"
        ALTER COLUMN "budget_price" TYPE numeric(10,2) USING budget_price::numeric(10,2)
    `);

    // job_cancellations: amounts were in cents → convert to dollars
    await queryRunner.query(`
      ALTER TABLE "service"."job_cancellations"
        ALTER COLUMN "total_paid"     TYPE numeric(10,2) USING (total_paid::numeric / 100),
        ALTER COLUMN "admin_fee"      TYPE numeric(10,2) USING (admin_fee::numeric / 100),
        ALTER COLUMN "refund_amount"  TYPE numeric(10,2) USING (refund_amount::numeric / 100)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."payments"
        ALTER COLUMN "amount"          TYPE int USING round(amount)::int,
        ALTER COLUMN "tax_gst_amount"  TYPE int USING round(tax_gst_amount)::int,
        ALTER COLUMN "platform_fee"    TYPE int USING round(platform_fee)::int,
        ALTER COLUMN "provider_amount" TYPE int USING round(provider_amount)::int
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."refunds"
        ALTER COLUMN "amount"                   TYPE int USING round(amount)::int,
        ALTER COLUMN "application_fee_refunded"  TYPE int USING round(application_fee_refunded)::int,
        ALTER COLUMN "transfer_reversed_fee"     TYPE int USING round(transfer_reversed_fee)::int
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."platform_fee_configs"
        ALTER COLUMN "cancellation_fee" TYPE int USING round(cancellation_fee * 100)::int,
        ALTER COLUMN "cancellation_fee" SET DEFAULT 1000
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."refund_requests"
        ALTER COLUMN "requested_amount" TYPE int USING round(requested_amount)::int
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."transactions"
        ALTER COLUMN "amount" TYPE int USING round(amount * 100)::int
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."subscription_periods"
        ALTER COLUMN "amount_total"    TYPE int USING round(amount_total)::int,
        ALTER COLUMN "tax_gst_amount"  TYPE int USING round(tax_gst_amount)::int,
        ALTER COLUMN "platform_fee"    TYPE int USING round(platform_fee)::int,
        ALTER COLUMN "provider_amount" TYPE int USING round(provider_amount)::int
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."subscriptions"
        ALTER COLUMN "application_fee" TYPE int USING round(application_fee * 100)::int
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."jobs"
        ALTER COLUMN "budget_price" TYPE int USING round(budget_price)::int
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."job_cancellations"
        ALTER COLUMN "total_paid"     TYPE int USING round(total_paid * 100)::int,
        ALTER COLUMN "admin_fee"      TYPE int USING round(admin_fee * 100)::int,
        ALTER COLUMN "refund_amount"  TYPE int USING round(refund_amount * 100)::int
    `);
  }
}
