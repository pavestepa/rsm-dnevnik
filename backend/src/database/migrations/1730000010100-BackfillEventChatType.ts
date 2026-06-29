import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillEventChatType1730000010100 implements MigrationInterface {
  name = 'BackfillEventChatType1730000010100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "chats" AS c
      SET "deletedAt" = now()
      FROM "events" AS e
      WHERE c."deletedAt" IS NULL
        AND c.type = 'group'
        AND c.id != e."chatId"
        AND e."deletedAt" IS NULL
        AND c."createdById" = e."createdById"
        AND c.title = e.title
    `);

    await queryRunner.query(`
      UPDATE "chats"
      SET type = 'event'
      WHERE id IN (
        SELECT "chatId" FROM "events" WHERE "deletedAt" IS NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "chats"
      SET type = 'group'
      WHERE type = 'event'
    `);
  }
}
