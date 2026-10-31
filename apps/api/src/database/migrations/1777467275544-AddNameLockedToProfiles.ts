import { MigrationInterface, QueryRunner } from 'typeorm';

// Locks a provider's keyed identity (name + date of birth) once their IDENTITY step is admin-approved,
// so it can't drift from the verified ID document / Stripe. Existing rows default to false.
export class AddNameLockedToProfiles1777467275544 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service"."profiles" ADD COLUMN IF NOT EXISTS "name_locked" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."profiles" DROP COLUMN IF EXISTS "name_locked"`);
  }
}
