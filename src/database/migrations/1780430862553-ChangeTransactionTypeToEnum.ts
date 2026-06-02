import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTransactionTypeToEnum1780430862553 implements MigrationInterface {
  name = 'ChangeTransactionTypeToEnum1780430862553';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."recurring_payments_frequency_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "recurring_payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" integer NOT NULL, "amount" numeric(12,2) NOT NULL, "frequency" "public"."recurring_payments_frequency_enum" NOT NULL, "beginDate" date NOT NULL, "nextExecuteDate" date, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "user_id" integer, "account_id" uuid, "category_id" uuid, CONSTRAINT "PK_bbce8e2920bd6ee89a7c4ebf78a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_be05009d1066df0465fd9ef6a0" ON "recurring_payments" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6bbedb5ebe1e11b205843ec566" ON "recurring_payments" ("account_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bc8e80b18873a3892da401a9d2" ON "recurring_payments" ("category_id") `,
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "type"`);
    await queryRunner.query(
      `CREATE TYPE "public"."transaction_type_enum" AS ENUM('INCOME', 'EXPENSE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "type" "public"."transaction_type_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_payments" ADD CONSTRAINT "FK_be05009d1066df0465fd9ef6a0c" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_payments" ADD CONSTRAINT "FK_6bbedb5ebe1e11b205843ec566d" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_payments" ADD CONSTRAINT "FK_bc8e80b18873a3892da401a9d2f" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recurring_payments" DROP CONSTRAINT "FK_bc8e80b18873a3892da401a9d2f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_payments" DROP CONSTRAINT "FK_6bbedb5ebe1e11b205843ec566d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_payments" DROP CONSTRAINT "FK_be05009d1066df0465fd9ef6a0c"`,
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."transaction_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "type" integer NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bc8e80b18873a3892da401a9d2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6bbedb5ebe1e11b205843ec566"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_be05009d1066df0465fd9ef6a0"`,
    );
    await queryRunner.query(`DROP TABLE "recurring_payments"`);
    await queryRunner.query(
      `DROP TYPE "public"."recurring_payments_frequency_enum"`,
    );
  }
}
