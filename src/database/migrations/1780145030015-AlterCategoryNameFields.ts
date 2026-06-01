import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCategoryNameFields1780145030015 implements MigrationInterface {
  name = 'AlterCategoryNameFields1780145030015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" ADD "nameEn" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD "nameUk" character varying`,
    );
    await queryRunner.query(
      `UPDATE "category" SET "nameEn" = "name", "nameUk" = "name"`,
    );
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "name"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" ADD "name" character varying`,
    );
    await queryRunner.query(
      `UPDATE "category" SET "name" = COALESCE("nameEn", "nameUk")`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ALTER COLUMN "name" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "nameUk"`);
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "nameEn"`);
  }
}
