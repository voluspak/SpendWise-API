import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionsTable1772560498205
  implements MigrationInterface
{
  name = 'CreateTransactionsTable1772560498205';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "transaction_type_enum" AS ENUM('INCOME', 'EXPENSE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "payment_method_enum" AS ENUM('CARD', 'CASH', 'TRANSFER', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "transaction_type_enum" NOT NULL, "amount" numeric(12,2) NOT NULL, "date" date NOT NULL, "description" character varying(500), "payment_method" "payment_method_enum" NOT NULL, "category_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_transactions_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_transactions_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_transactions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transactions_user_id" ON "transactions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transactions_category_id" ON "transactions" ("category_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transactions_date" ON "transactions" ("date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_transactions_date"`);
    await queryRunner.query(`DROP INDEX "idx_transactions_category_id"`);
    await queryRunner.query(`DROP INDEX "idx_transactions_user_id"`);
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_category_id"`,
    );
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
  }
}
