import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateReportStatusEnum1777467275499 implements MigrationInterface {
  name = 'UpdateReportStatusEnum1777467275499';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "service"."report_status_new" AS ENUM ('pending', 'warning_sent', 'resolved', 'suspended', 'dismissed')`);
    await queryRunner.query(`ALTER TABLE "service"."user_reports" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(`
      ALTER TABLE "service"."user_reports"
        ALTER COLUMN "status" TYPE "service"."report_status_new"
        USING status::text::"service"."report_status_new"
    `);
    await queryRunner.query(`ALTER TABLE "service"."user_reports" ALTER COLUMN "status" SET DEFAULT 'pending'`);
    await queryRunner.query(`DROP TYPE "service"."report_status"`);
    await queryRunner.query(`ALTER TYPE "service"."report_status_new" RENAME TO "report_status"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "service"."user_reports" SET status = 'dismissed' WHERE status IN ('suspended', 'resolved')`);
    await queryRunner.query(`CREATE TYPE "service"."report_status_new" AS ENUM ('pending', 'warning_sent', 'resolved', 'dismissed')`);
    await queryRunner.query(`ALTER TABLE "service"."user_reports" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(`
      ALTER TABLE "service"."user_reports"
        ALTER COLUMN "status" TYPE "service"."report_status_new"
        USING status::text::"service"."report_status_new"
    `);
    await queryRunner.query(`ALTER TABLE "service"."user_reports" ALTER COLUMN "status" SET DEFAULT 'pending'`);
    await queryRunner.query(`DROP TYPE "service"."report_status"`);
    await queryRunner.query(`ALTER TYPE "service"."report_status_new" RENAME TO "report_status"`);
  }
}
