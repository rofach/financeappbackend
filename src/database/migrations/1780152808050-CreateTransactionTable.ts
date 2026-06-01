import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionTable1780152808050 implements MigrationInterface {
  name = 'CreateTransactionTable1780152808050';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" integer NOT NULL, "amount" numeric(12,2) NOT NULL, "baseAmount" numeric(12,2) NOT NULL, "date" TIMESTAMP NOT NULL, "note" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "user_id" uuid, "account_id" uuid, "category_id" uuid, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4a3d92d5dde30f3ab5c34c586" ON "transaction" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e2652fa8c16723c83a00fb9b17" ON "transaction" ("account_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_abbe63b71ee4193f61c322ab49" ON "transaction" ("category_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_b4a3d92d5dde30f3ab5c34c5862" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_e2652fa8c16723c83a00fb9b17e" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_abbe63b71ee4193f61c322ab497" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_abbe63b71ee4193f61c322ab497"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_e2652fa8c16723c83a00fb9b17e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_b4a3d92d5dde30f3ab5c34c5862"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_abbe63b71ee4193f61c322ab49"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e2652fa8c16723c83a00fb9b17"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b4a3d92d5dde30f3ab5c34c586"`,
    );
    await queryRunner.query(`DROP TABLE "transaction"`);
  }
}
