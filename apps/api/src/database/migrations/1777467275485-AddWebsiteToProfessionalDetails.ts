import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWebsiteToProfessionalDetails1777467275485 implements MigrationInterface {
  name = 'AddWebsiteToProfessionalDetails1777467275485';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."provider_professional_details" ADD COLUMN IF NOT EXISTS "website" varchar(500) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."provider_professional_details" DROP COLUMN IF EXISTS "website"`,
    );
  }
}
