import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoryTable1780089305647 implements MigrationInterface {
  name = 'CreateCategoryTable1780089305647';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "user_id" uuid, CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6562e564389d0600e6e243d960" ON "category" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_6562e564389d0600e6e243d9604" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" DROP CONSTRAINT "FK_6562e564389d0600e6e243d9604"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6562e564389d0600e6e243d960"`,
    );
    await queryRunner.query(`DROP TABLE "category"`);
  }
}
