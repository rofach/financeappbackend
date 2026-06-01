import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSymbolFromCurrency1780154219537 implements MigrationInterface {
  name = 'RemoveSymbolFromCurrency1780154219537';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "currency" DROP COLUMN "symbol"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "currency" ADD "symbol" character varying NOT NULL`,
    );
  }
}
