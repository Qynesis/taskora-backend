import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTfnToProviderWorkInfo1777467275500 implements MigrationInterface {
  name = 'AddTfnToProviderWorkInfo1777467275500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."provider_work_info" ADD COLUMN "tfn" varchar(512) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service"."provider_work_info" DROP COLUMN "tfn"`);
  }
}
