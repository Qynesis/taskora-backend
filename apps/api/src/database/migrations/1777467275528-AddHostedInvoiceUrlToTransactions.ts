import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHostedInvoiceUrlToTransactions1777467275528 implements MigrationInterface {
  name = 'AddHostedInvoiceUrlToTransactions1777467275528';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Each money movement (single-task charge / each subscription cycle) is its own Stripe
    // invoice with its own hosted URL. Store it per transaction so no cycle's invoice link is
    // lost (the contract-level payment row only ever kept the latest one).
    await queryRunner.query(`
      ALTER TABLE "service"."transactions"
      ADD COLUMN IF NOT EXISTS "hosted_invoice_url" text NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."transactions"
      DROP COLUMN IF EXISTS "hosted_invoice_url"
    `);
  }
}
