import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropIdNumberFromVerificationSteps1777467275515 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "provider_verification_steps"
      DROP COLUMN IF EXISTS "id_number"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "provider_verification_steps"
      ADD COLUMN IF NOT EXISTS "id_number" VARCHAR(50) NULL
    `);
  }
}
