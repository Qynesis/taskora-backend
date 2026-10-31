import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeFieldsToTransactions1777467275506 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "stripe_invoice_id" varchar(255)`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" varchar(255)`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "platform_fee" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "provider_payout" numeric(10,2)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_transactions_stripe_invoice_id" ON "transactions" ("stripe_invoice_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_transactions_stripe_subscription_id" ON "transactions" ("stripe_subscription_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_stripe_subscription_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_stripe_invoice_id"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "provider_payout"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "platform_fee"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "stripe_subscription_id"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "stripe_invoice_id"`);
    }
}
