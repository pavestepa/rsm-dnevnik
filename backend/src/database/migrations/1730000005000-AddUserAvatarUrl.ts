import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAvatarUrl1730000005000 implements MigrationInterface {
  name = 'AddUserAvatarUrl1730000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "avatarUrl" character varying(1024)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatarUrl"`);
  }
}
