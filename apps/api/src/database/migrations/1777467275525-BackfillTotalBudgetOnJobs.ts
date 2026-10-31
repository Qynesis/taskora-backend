import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillTotalBudgetOnJobs1777467275525 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE service.jobs
      SET total_budget = ROUND(
        budget_price
        * CASE budget_period
            WHEN 'weekly'      THEN 4
            WHEN 'fortnightly' THEN 2
            WHEN 'monthly'     THEN 1
            ELSE                    1
          END
        * CASE service_duration
            WHEN '1_month'   THEN 1
            WHEN '3_months'  THEN 3
            WHEN '6_months'  THEN 6
            ELSE                  1
          END,
        2
      )
      WHERE budget_price IS NOT NULL
        AND total_budget IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // intentionally left blank — nullifying totalBudget on rollback would lose data
  }
}
