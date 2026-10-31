import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropStripeIdsFromPayments1777467275522 implements MigrationInterface {
  name = 'DropStripeIdsFromPayments1777467275522';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill existing transaction rows with the charge/intent IDs from their linked payment
    // before dropping those columns. This preserves refund capability for pre-migration payments.
    await queryRunner.query(`
      UPDATE "service"."transactions" t
      SET
        stripe_charge_id         = p.stripe_charge_id,
        stripe_payment_intent_id = p.stripe_payment_intent_id
      FROM "service"."payments" p
      WHERE t.payment_id = p.id
        AND t.stripe_charge_id IS NULL
        AND p.stripe_charge_id IS NOT NULL
    `);

    await queryRunner.query(`ALTER TABLE "service"."payments" DROP COLUMN IF EXISTS "stripe_payment_intent_id"`);
    await queryRunner.query(`ALTER TABLE "service"."payments" DROP COLUMN IF EXISTS "stripe_charge_id"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."payments" ADD COLUMN IF NOT EXISTS "stripe_charge_id" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "service"."payments" ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" varchar(255) UNIQUE`);
  }
}
