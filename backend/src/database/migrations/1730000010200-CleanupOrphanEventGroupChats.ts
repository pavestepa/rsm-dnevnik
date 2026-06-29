import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupOrphanEventGroupChats1730000010200 implements MigrationInterface {
  name = 'CleanupOrphanEventGroupChats1730000010200';

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
        AND regexp_replace(c.title, '\\s+', '', 'g') = regexp_replace(e.title, '\\s+', '', 'g')
    `);
  }

  public async down(): Promise<void> {
    // Orphan cleanup cannot be restored safely.
    return Promise.resolve();
  }
}
