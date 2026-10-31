import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSelectedFromBidStatus1777467275477 implements MigrationInterface {
  name = 'RemoveSelectedFromBidStatus1777467275477';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migrate any existing 'selected' bids to 'accepted'
    await queryRunner.query(`
      UPDATE "service"."bids" SET "status" = 'accepted' WHERE "status" = 'selected'
    `);

    // Drop the column default (it holds a reference to the enum type)
    await queryRunner.query(`
      ALTER TABLE "service"."bids" ALTER COLUMN "status" DROP DEFAULT
    `);

    // Change column to plain text so we can drop the enum type
    await queryRunner.query(`
      ALTER TABLE "service"."bids"
        ALTER COLUMN "status" TYPE varchar(50)
    `);

    await queryRunner.query(`DROP TYPE IF EXISTS "service"."bid_status"`);

    await queryRunner.query(`
      CREATE TYPE "service"."bid_status" AS ENUM ('submitted', 'declined', 'accepted')
    `);

    // Restore column type and default
    await queryRunner.query(`
      ALTER TABLE "service"."bids"
        ALTER COLUMN "status" TYPE "service"."bid_status"
        USING "status"::"service"."bid_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."bids"
        ALTER COLUMN "status" SET DEFAULT 'submitted'::"service"."bid_status"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "service"."bids" ALTER COLUMN "status" DROP DEFAULT
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."bids"
        ALTER COLUMN "status" TYPE varchar(50)
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "service"."bid_status"`);
    await queryRunner.query(`
      CREATE TYPE "service"."bid_status" AS ENUM ('submitted', 'declined', 'accepted', 'selected')
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."bids"
        ALTER COLUMN "status" TYPE "service"."bid_status"
        USING "status"::"service"."bid_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "service"."bids"
        ALTER COLUMN "status" SET DEFAULT 'submitted'::"service"."bid_status"
    `);
  }
}
