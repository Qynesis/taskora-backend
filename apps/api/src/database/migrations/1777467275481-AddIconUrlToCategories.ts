import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIconUrlToCategories1777467275481 implements MigrationInterface {
  name = 'AddIconUrlToCategories1777467275481';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."categories" ADD COLUMN IF NOT EXISTS "icon_url" varchar(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."categories" DROP COLUMN IF EXISTS "icon_url"`,
    );
  }
}
