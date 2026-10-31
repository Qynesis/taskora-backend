import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeIdsToTransactions1777467275521 implements MigrationInterface {
  name = 'AddStripeIdsToTransactions1777467275521';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."transactions" ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "service"."transactions" ADD COLUMN IF NOT EXISTS "stripe_charge_id" varchar(255)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."transactions" DROP COLUMN IF EXISTS "stripe_charge_id"`);
    await queryRunner.query(`ALTER TABLE "service"."transactions" DROP COLUMN IF EXISTS "stripe_payment_intent_id"`);
  }
}
