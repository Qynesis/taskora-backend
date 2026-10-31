import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropDepositRequiredFromJobContracts1777467275507 implements MigrationInterface {
  name = 'DropDepositRequiredFromJobContracts1777467275507';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."job_contracts" DROP COLUMN IF EXISTS "deposit_required"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."job_contracts" ADD COLUMN IF NOT EXISTS "deposit_required" boolean NOT NULL DEFAULT false`);
  }
}
