import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeProfessionalRatesNullable1777467275541 implements MigrationInterface {
  name = 'MakeProfessionalRatesNullable1777467275541';

  private readonly columns = [
    'rate_per_hour_weekday',
    'rate_per_hour_weekend',
    'rate_per_hour_holiday',
    'subscription_rate_1_month',
    'subscription_rate_3_months',
    'subscription_rate_6_months',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const col of this.columns) {
      await queryRunner.query(
        `ALTER TABLE "service"."provider_professional_details" ALTER COLUMN "${col}" DROP NOT NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Backfill any NULLs to 0 so the NOT NULL constraint can be restored.
    for (const col of this.columns) {
      await queryRunner.query(
        `UPDATE "service"."provider_professional_details" SET "${col}" = 0 WHERE "${col}" IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "service"."provider_professional_details" ALTER COLUMN "${col}" SET NOT NULL`,
      );
    }
  }
}
