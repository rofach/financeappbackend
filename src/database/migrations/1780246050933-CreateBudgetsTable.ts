import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBudgetsTable1780246050933 implements MigrationInterface {
  name = 'CreateBudgetsTable1780246050933';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "budget" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "limitAmount" numeric(10,2) NOT NULL, "period" integer NOT NULL, "startDate" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" integer, "categoryId" uuid, CONSTRAINT "PK_9af87bcfd2de21bd9630dddaa0e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget" ADD CONSTRAINT "FK_8ed65c868c97a5fb471d85efb01" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget" ADD CONSTRAINT "FK_4aeadf37446801c8f4d2d26441b" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "budget" DROP CONSTRAINT "FK_4aeadf37446801c8f4d2d26441b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget" DROP CONSTRAINT "FK_8ed65c868c97a5fb471d85efb01"`,
    );
    await queryRunner.query(`DROP TABLE "budget"`);
  }
}
