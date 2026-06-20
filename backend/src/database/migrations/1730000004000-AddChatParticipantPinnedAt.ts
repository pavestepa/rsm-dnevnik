import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatParticipantPinnedAt1730000004000
  implements MigrationInterface
{
  name = 'AddChatParticipantPinnedAt1730000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chat_participants"
      ADD COLUMN "pinnedAt" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chat_participants"
      DROP COLUMN "pinnedAt"
    `);
  }
}
