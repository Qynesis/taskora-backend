import { MigrationInterface, QueryRunner } from 'typeorm';
import * as crypto from 'crypto';

function encryptValue(text: string): string {
  const hexKey = process.env.DB_ENCRYPTION_KEY!;
  const key = Buffer.from(hexKey, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export class SeedTfnForExistingWorkInfo1777467275502 implements MigrationInterface {
  name = 'SeedTfnForExistingWorkInfo1777467275502';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const encryptedTfn = encryptValue('123456782');
    await queryRunner.query(
      `UPDATE "service"."provider_work_info" SET "tfn" = $1 WHERE "tfn" IS NULL`,
      [encryptedTfn],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "service"."provider_work_info" SET "tfn" = NULL`);
  }
}
