import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthColumnsToUsers1772560298205 implements MigrationInterface {
  name = 'AddAuthColumnsToUsers1772560298205';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "refresh_token_hash" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_reset_token" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_reset_expires" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "google_id" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_users_google_id" UNIQUE ("google_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_users_google_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "google_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "password_reset_expires"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "password_reset_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "refresh_token_hash"`,
    );
  }
}
