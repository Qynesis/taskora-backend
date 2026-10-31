import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaxGstAmountToTransactions1777467275526 implements MigrationInterface {
  name = 'AddTaxGstAmountToTransactions1777467275526';

  async up(queryRunner: QueryRunner): Promise<void> {
    // GST is a per-money-movement fact (single-task charge / each subscription cycle),
    // so it lives on the transaction ledger alongside platform_fee and provider_payout.
    await queryRunner.query(`
      ALTER TABLE "service"."transactions"
      ADD COLUMN IF NOT EXISTS "tax_gst_amount" numeric(10, 2) NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."transactions"
      DROP COLUMN IF EXISTS "tax_gst_amount"
    `);
  }
}
