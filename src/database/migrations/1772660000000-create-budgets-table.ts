import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBudgetsTable1772660000000 implements MigrationInterface {
  name = 'CreateBudgetsTable1772660000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "budget_period_enum" AS ENUM('WEEKLY', 'MONTHLY', 'YEARLY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "budgets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount_limit" numeric(12,2) NOT NULL, "period" "budget_period_enum" NOT NULL, "category_id" uuid NOT NULL, "user_id" uuid NOT NULL, "alert_threshold" integer NOT NULL DEFAULT 80, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_budgets_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_budgets_user_category_period" UNIQUE ("user_id", "category_id", "period"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" ADD CONSTRAINT "FK_budgets_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" ADD CONSTRAINT "FK_budgets_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_budgets_user_id" ON "budgets" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_budgets_category_id" ON "budgets" ("category_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_budgets_category_id"`);
    await queryRunner.query(`DROP INDEX "idx_budgets_user_id"`);
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "FK_budgets_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budgets" DROP CONSTRAINT "FK_budgets_category_id"`,
    );
    await queryRunner.query(`DROP TABLE "budgets"`);
    await queryRunner.query(`DROP TYPE "budget_period_enum"`);
  }
}
