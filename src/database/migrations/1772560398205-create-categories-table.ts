import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesTable1772560398205 implements MigrationInterface {
  name = 'CreateCategoriesTable1772560398205';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "icon" character varying(50) NOT NULL, "color" character varying(7) NOT NULL, "is_global" boolean NOT NULL DEFAULT false, "user_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_categories_user_id" ON "categories" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_categories_user_id"`);
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
