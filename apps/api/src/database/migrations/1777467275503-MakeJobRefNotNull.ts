import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeJobRefNotNull1777467275503 implements MigrationInterface {
  name = 'MakeJobRefNotNull1777467275503';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill each NULL row with a unique JOB-XXXXXX ref, retrying on collision
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        candidate VARCHAR;
      BEGIN
        FOR rec IN SELECT id FROM service.jobs WHERE job_ref IS NULL LOOP
          LOOP
            candidate := 'JOB-' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM service.jobs WHERE job_ref = candidate);
          END LOOP;
          UPDATE service.jobs SET job_ref = candidate WHERE id = rec.id;
        END LOOP;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "service"."jobs" ALTER COLUMN "job_ref" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."jobs" ALTER COLUMN "job_ref" DROP NOT NULL
    `);
  }
}
