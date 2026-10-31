import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropWebsiteFromProfessionalDetails1777467275501 implements MigrationInterface {
  name = 'DropWebsiteFromProfessionalDetails1777467275501';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."provider_professional_details" DROP COLUMN IF EXISTS "website"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."provider_professional_details" ADD COLUMN "website" varchar(500) NULL`);
  }
}
