import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProviderRatingSummaries1777467275516 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "provider_rating_summaries" (
        "provider_id"    UUID          NOT NULL,
        "average_rating" NUMERIC(3, 1) NOT NULL DEFAULT 0,
        "review_count"   INT           NOT NULL DEFAULT 0,
        "updated_at"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_provider_rating_summaries" PRIMARY KEY ("provider_id"),
        CONSTRAINT "FK_provider_rating_summaries_user"
          FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "provider_rating_summaries"`);
  }
}
