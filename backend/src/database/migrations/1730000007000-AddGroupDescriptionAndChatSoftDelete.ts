import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupDescriptionAndChatSoftDelete1730000007000 implements MigrationInterface {
  name = 'AddGroupDescriptionAndChatSoftDelete1730000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chats"
      ADD COLUMN "description" varchar(512),
      ADD COLUMN "deletedAt" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chats"
      DROP COLUMN "deletedAt",
      DROP COLUMN "description"
    `);
  }
}
