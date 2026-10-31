import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewTitle1777467275496 implements MigrationInterface {
  name = 'AddReviewTitle1777467275496';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reviews"
      ADD COLUMN IF NOT EXISTS "title" varchar(150) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN IF EXISTS "title"`);
  }
}
