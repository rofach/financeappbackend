import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBaseCurrencyToUser1780176012318 implements MigrationInterface {
  name = 'AddBaseCurrencyToUser1780176012318';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_9b46297b50560cb0935dd785121"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "base_currency"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "baseCurrencyCode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" DROP CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "FK_efef1e5fdbe318a379c06678c51"`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" DROP CONSTRAINT "FK_6562e564389d0600e6e243d9604"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_b4a3d92d5dde30f3ab5c34c5862"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "PK_cace4a159ff9f2512dd42373760"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "user" ADD "id" SERIAL NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_efef1e5fdbe318a379c06678c5"`,
    );
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "account" ADD "user_id" integer`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6562e564389d0600e6e243d960"`,
    );
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "category" ADD "user_id" integer`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b4a3d92d5dde30f3ab5c34c586"`,
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "transaction" ADD "user_id" integer`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d2f174ef04fb312fdebd0ddc5"`,
    );
    await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "session" ADD "userId" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_efef1e5fdbe318a379c06678c5" ON "account" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6562e564389d0600e6e243d960" ON "category" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4a3d92d5dde30f3ab5c34c586" ON "transaction" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d2f174ef04fb312fdebd0ddc5" ON "session" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_5d9fd3178ace5cde874a4125f5a" FOREIGN KEY ("baseCurrencyCode") REFERENCES "currency"("code") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "FK_efef1e5fdbe318a379c06678c51" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_6562e564389d0600e6e243d9604" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_b4a3d92d5dde30f3ab5c34c5862" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "session" DROP CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_b4a3d92d5dde30f3ab5c34c5862"`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" DROP CONSTRAINT "FK_6562e564389d0600e6e243d9604"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "FK_efef1e5fdbe318a379c06678c51"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_5d9fd3178ace5cde874a4125f5a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d2f174ef04fb312fdebd0ddc5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b4a3d92d5dde30f3ab5c34c586"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6562e564389d0600e6e243d960"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_efef1e5fdbe318a379c06678c5"`,
    );
    await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "session" ADD "userId" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_3d2f174ef04fb312fdebd0ddc5" ON "session" ("userId") `,
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "transaction" ADD "user_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_b4a3d92d5dde30f3ab5c34c586" ON "transaction" ("user_id") `,
    );
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "category" ADD "user_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_6562e564389d0600e6e243d960" ON "category" ("user_id") `,
    );
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "account" ADD "user_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_efef1e5fdbe318a379c06678c5" ON "account" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "PK_cace4a159ff9f2512dd42373760"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_b4a3d92d5dde30f3ab5c34c5862" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_6562e564389d0600e6e243d9604" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "FK_efef1e5fdbe318a379c06678c51" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "baseCurrencyCode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "base_currency" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_9b46297b50560cb0935dd785121" FOREIGN KEY ("base_currency") REFERENCES "currency"("code") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
