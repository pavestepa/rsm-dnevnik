import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserCredentials1730000001000 implements MigrationInterface {
  name = 'AddUserCredentials1730000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "login" character varying(128)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "passwordHash" character varying(255)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "UQ_users_login" UNIQUE ("login")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_users_login"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordHash"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "login"`);
  }
}
