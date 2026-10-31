import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorInvoiceColumns1777467275519 implements MigrationInterface {
  name = 'RefactorInvoiceColumns1777467275519';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Drop invoice_number and invoice_pdf_url from payments — moved to transactions
    await queryRunner.query(`ALTER TABLE "service"."payments" DROP COLUMN IF EXISTS "invoice_number"`);
    await queryRunner.query(`ALTER TABLE "service"."payments" DROP COLUMN IF EXISTS "invoice_pdf_url"`);

    // Add invoice_number to transactions — one per cycle for subscription jobs
    await queryRunner.query(`ALTER TABLE "service"."transactions" ADD COLUMN IF NOT EXISTS "invoice_number" varchar(50)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."transactions" DROP COLUMN IF EXISTS "invoice_number"`);
    await queryRunner.query(`ALTER TABLE "service"."payments" ADD COLUMN IF NOT EXISTS "invoice_pdf_url" text`);
    await queryRunner.query(`ALTER TABLE "service"."payments" ADD COLUMN IF NOT EXISTS "invoice_number" varchar(50)`);
  }
}
