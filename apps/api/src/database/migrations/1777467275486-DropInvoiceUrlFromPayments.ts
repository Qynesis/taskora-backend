import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropInvoiceUrlFromPayments1777467275486 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN IF EXISTS "invoice_url"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "invoice_url" text`);
    }
}
