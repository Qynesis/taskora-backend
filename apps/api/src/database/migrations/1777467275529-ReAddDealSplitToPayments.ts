import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReAddDealSplitToPayments1777467275529 implements MigrationInterface {
  name = 'ReAddDealSplitToPayments1777467275529';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Re-add the tax-free "deal" split to the payment row: how the original price divides
    // between platform and provider. Set once at selection, never accumulated. GST is NOT
    // re-added here — it stays on the Transaction ledger (added on top of the price per charge).
    await queryRunner.query(`
      ALTER TABLE "service"."payments"
        ADD COLUMN IF NOT EXISTS "platform_fee"    numeric(10, 2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "provider_amount" numeric(10, 2) NOT NULL DEFAULT 0
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."payments"
        DROP COLUMN IF EXISTS "platform_fee",
        DROP COLUMN IF EXISTS "provider_amount"
    `);
  }
}
