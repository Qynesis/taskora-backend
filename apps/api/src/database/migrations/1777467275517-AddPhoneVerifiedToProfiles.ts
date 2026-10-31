import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneVerifiedToProfiles1777467275517 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "profiles"
      ADD COLUMN IF NOT EXISTS "phone_verified" BOOLEAN NOT NULL DEFAULT FALSE
    `);
    await queryRunner.query(`UPDATE "profiles" SET "phone_verified" = FALSE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN IF EXISTS "phone_verified"`);
  }
}
