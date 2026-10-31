import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvoiceAndCreditNoteFields1777467275482 implements MigrationInterface {
  name = 'AddInvoiceAndCreditNoteFields1777467275482';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── payments ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "service"."payments"
        ADD COLUMN IF NOT EXISTS "invoice_number"      varchar(50),
        ADD COLUMN IF NOT EXISTS "hosted_invoice_url"  text,
        ADD COLUMN IF NOT EXISTS "invoice_pdf_url"     text,
        ADD COLUMN IF NOT EXISTS "invoice_status"      varchar(30)
    `);

    // ── refunds ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "service"."refunds"
        ADD COLUMN IF NOT EXISTS "stripe_credit_note_id" varchar(255) UNIQUE,
        ADD COLUMN IF NOT EXISTS "credit_note_pdf_url"   text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."refunds"
        DROP COLUMN IF EXISTS "stripe_credit_note_id",
        DROP COLUMN IF EXISTS "credit_note_pdf_url"
    `);

    await queryRunner.query(`
      ALTER TABLE "service"."payments"
        DROP COLUMN IF EXISTS "invoice_number",
        DROP COLUMN IF EXISTS "hosted_invoice_url",
        DROP COLUMN IF EXISTS "invoice_pdf_url",
        DROP COLUMN IF EXISTS "invoice_status"
    `);
  }
}
