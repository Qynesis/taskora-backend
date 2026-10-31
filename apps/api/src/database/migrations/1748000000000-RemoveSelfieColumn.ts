import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSelfieColumn1748000000000 implements MigrationInterface {
  name = 'RemoveSelfieColumn1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."provider_verification_steps" DROP COLUMN IF EXISTS "selfie_vendor_session_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."provider_verification_steps" ADD COLUMN "selfie_vendor_session_id" varchar(120) NULL`);
  }
}
