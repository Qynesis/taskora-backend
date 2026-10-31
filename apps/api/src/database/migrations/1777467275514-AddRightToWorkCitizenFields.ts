import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRightToWorkCitizenFields1777467275514 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "provider_verification_steps"
      ADD COLUMN IF NOT EXISTS "citizen_document_type" VARCHAR(30) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "provider_verification_step_files"
      ADD COLUMN IF NOT EXISTS "label" VARCHAR(20) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "provider_verification_step_files"
      DROP COLUMN IF EXISTS "label"
    `);

    await queryRunner.query(`
      ALTER TABLE "provider_verification_steps"
      DROP COLUMN IF EXISTS "citizen_document_type"
    `);
  }
}
