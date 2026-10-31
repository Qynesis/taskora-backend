import { MigrationInterface, QueryRunner } from 'typeorm';

// 7371 isn't in Stripe's supported MCC subset — Connect onboarding rejects it. Move these three
// IT categories to 7372. Scoped by name so `down` reverts only these rows.
export class FixInvalidItMccCodes1777467275543 implements MigrationInterface {
  private readonly names = [
    'IT Consulting & Strategy',
    'Technical Support & Help Desk',
    'ICT Network Setup',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "service"."categories" SET "mcc" = '7372' WHERE "name" = ANY($1)`,
      [this.names],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "service"."categories" SET "mcc" = '7371' WHERE "name" = ANY($1)`,
      [this.names],
    );
  }
}
