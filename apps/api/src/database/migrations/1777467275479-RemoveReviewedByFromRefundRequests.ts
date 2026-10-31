import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveReviewedByFromRefundRequests1777467275479 implements MigrationInterface {
  name = 'RemoveReviewedByFromRefundRequests1777467275479';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."refund_requests" DROP COLUMN IF EXISTS "reviewed_by_user_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."refund_requests"
        ADD COLUMN "reviewed_by_user_id" uuid REFERENCES "service"."users"("id") ON DELETE SET NULL
    `);
  }
}
