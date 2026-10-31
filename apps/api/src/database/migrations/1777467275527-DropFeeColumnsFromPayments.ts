import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropFeeColumnsFromPayments1777467275527 implements MigrationInterface {
  name = 'DropFeeColumnsFromPayments1777467275527';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Platform fee, provider payout and GST are per-money-movement facts recorded on the
    // Transaction ledger. Remove the denormalized (and, for subscriptions, incoherent)
    // copies from the contract-level payments row.
    await queryRunner.query(`
      ALTER TABLE "service"."payments"
        DROP COLUMN IF EXISTS "platform_fee",
        DROP COLUMN IF EXISTS "provider_amount",
        DROP COLUMN IF EXISTS "tax_gst_amount"
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."payments"
        ADD COLUMN IF NOT EXISTS "platform_fee"    numeric(10, 2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "provider_amount" numeric(10, 2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "tax_gst_amount"  numeric(10, 2) NOT NULL DEFAULT 0
    `);
  }
}
