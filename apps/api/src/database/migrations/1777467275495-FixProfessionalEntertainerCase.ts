import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixProfessionalEntertainerCase1777467275495 implements MigrationInterface {
  name = 'FixProfessionalEntertainerCase1777467275495';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE service.categories SET name = $1 WHERE name = $2`,
      ['Professional Entertainer', 'Professional entertainer'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE service.categories SET name = $1 WHERE name = $2`,
      ['Professional entertainer', 'Professional Entertainer'],
    );
  }
}
