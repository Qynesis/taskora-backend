import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropTfnFromProviderWorkInfo1777467275504 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provider_work_info" DROP COLUMN IF EXISTS "tfn"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provider_work_info" ADD COLUMN "tfn" varchar(512)`);
    }
}
