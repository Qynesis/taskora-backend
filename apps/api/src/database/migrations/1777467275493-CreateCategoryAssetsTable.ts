import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoryAssetsTable1777467275493 implements MigrationInterface {
  name = 'CreateCategoryAssetsTable1777467275493';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "service"."category_asset_type" AS ENUM ('cover', 'sub_cover')
    `);
    await queryRunner.query(`
      CREATE TABLE "service"."category_assets" (
        "id"          uuid         NOT NULL DEFAULT gen_random_uuid(),
        "category_id" uuid         NOT NULL,
        "type"        "service"."category_asset_type" NOT NULL,
        "url"         varchar(500) NOT NULL,
        "created_at"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_category_assets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_category_assets_category_type" UNIQUE ("category_id", "type"),
        CONSTRAINT "FK_category_assets_category"
          FOREIGN KEY ("category_id")
          REFERENCES "service"."categories"("id")
          ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_category_assets_category_id"
        ON "service"."category_assets" ("category_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "service"."IDX_category_assets_category_id"`);
    await queryRunner.query(`DROP TABLE "service"."category_assets"`);
    await queryRunner.query(`DROP TYPE "service"."category_asset_type"`);
  }
}
