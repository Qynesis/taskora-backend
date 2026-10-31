import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropCancellationFeeFromPlatformFeeConfig1777467275541 implements MigrationInterface {
  name = 'DropCancellationFeeFromPlatformFeeConfig1777467275541';

  async up(queryRunner: QueryRunner): Promise<void> {
    // The flat admin fee was replaced by cancellation_fee_percent (10%). This column is now
    // unused by every code path, so drop it to avoid a misleading second "fee" column.
    await queryRunner.query(`
      ALTER TABLE "service"."platform_fee_configs"
      DROP COLUMN IF EXISTS "cancellation_fee"
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."platform_fee_configs"
      ADD COLUMN IF NOT EXISTS "cancellation_fee" numeric(10,2) NOT NULL DEFAULT 10
    `);
  }
}
