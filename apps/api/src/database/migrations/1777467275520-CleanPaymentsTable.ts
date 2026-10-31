import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanPaymentsTable1777467275520 implements MigrationInterface {
  name = 'CleanPaymentsTable1777467275520';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_subscription flag
    await queryRunner.query(`ALTER TABLE "service"."payments" ADD COLUMN IF NOT EXISTS "is_subscription" boolean NOT NULL DEFAULT false`);

    // Backfill BEFORE dropping subscription_id — mark existing subscription payments.
    // Guard against subscription_id not existing (it may never have been in this environment).
    const hasSubscriptionId = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'service'
        AND table_name = 'payments'
        AND column_name = 'subscription_id'
    `);
    if (hasSubscriptionId.length > 0) {
      await queryRunner.query(`
        UPDATE "service"."payments"
        SET is_subscription = true
        WHERE subscription_id IS NOT NULL
      `);
    }

    // Remove columns that are never queried or returned in responses
    await queryRunner.query(`ALTER TABLE "service"."payments" DROP COLUMN IF EXISTS "stripe_transfer_id"`);
    await queryRunner.query(`ALTER TABLE "service"."payments" DROP COLUMN IF EXISTS "stripe_balance_txn_id"`);
    await queryRunner.query(`ALTER TABLE "service"."payments" DROP COLUMN IF EXISTS "invoice_status"`);
    await queryRunner.query(`ALTER TABLE "service"."payments" DROP COLUMN IF EXISTS "subscription_id"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."payments" DROP COLUMN IF EXISTS "is_subscription"`);
    await queryRunner.query(`ALTER TABLE "service"."payments" ADD COLUMN IF NOT EXISTS "subscription_id" uuid`);
    await queryRunner.query(`ALTER TABLE "service"."payments" ADD COLUMN IF NOT EXISTS "invoice_status" varchar(30)`);
    await queryRunner.query(`ALTER TABLE "service"."payments" ADD COLUMN IF NOT EXISTS "stripe_balance_txn_id" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "service"."payments" ADD COLUMN IF NOT EXISTS "stripe_transfer_id" varchar(255)`);
  }
}
