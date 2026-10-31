import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeIdentitySessionToVerificationSteps1777467275508 implements MigrationInterface {
  name = 'AddStripeIdentitySessionToVerificationSteps1777467275508';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_steps" ADD COLUMN IF NOT EXISTS "stripe_identity_session_id" varchar(64)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."provider_verification_steps" DROP COLUMN IF EXISTS "stripe_identity_session_id"`,
    );
  }
}
