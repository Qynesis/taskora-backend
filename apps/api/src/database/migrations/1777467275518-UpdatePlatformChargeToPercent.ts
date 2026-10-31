import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePlatformChargeToPercent1777467275518 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "platform_fee_configs"
      SET "platform_charge" = 11.99
      WHERE "platform_charge" = 10
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "platform_fee_configs"
      SET "platform_charge" = 10
      WHERE "platform_charge" = 11.99
    `);
  }
}
