import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropInvoiceIdFromPayments1777467275523 implements MigrationInterface {
  name = 'DropInvoiceIdFromPayments1777467275523';

  async up(queryRunner: QueryRunner): Promise<void> {
    // stripe_invoice_id is already stored per Transaction row — no backfill needed.
    await queryRunner.query(`ALTER TABLE "service"."payments" DROP COLUMN IF EXISTS "stripe_invoice_id"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."payments" ADD COLUMN IF NOT EXISTS "stripe_invoice_id" varchar(255) UNIQUE`);
  }
}
