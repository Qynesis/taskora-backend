import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCancellationFeePercentToPlatformFeeConfig1777467275540 implements MigrationInterface {
  name = 'AddCancellationFeePercentToPlatformFeeConfig1777467275540';

  async up(queryRunner: QueryRunner): Promise<void> {
    // The cancellation/refund admin fee moved from a flat dollar amount to a percentage of the
    // refunded amount. Seed existing config rows to 10% so behaviour is unchanged for a $100 job.
    await queryRunner.query(`
      ALTER TABLE "service"."platform_fee_configs"
      ADD COLUMN IF NOT EXISTS "cancellation_fee_percent" numeric(10,2) NOT NULL DEFAULT 10
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."platform_fee_configs"
      DROP COLUMN IF EXISTS "cancellation_fee_percent"
    `);
  }
}
