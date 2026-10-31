import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIdNumberToVerificationSteps1777467275484 implements MigrationInterface {
  name = 'AddIdNumberToVerificationSteps1777467275484';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_steps" ADD COLUMN IF NOT EXISTS "id_number" varchar(50) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_steps" DROP COLUMN IF EXISTS "id_number"`,
    );
  }
}
