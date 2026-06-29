import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventChatType1730000010000 implements MigrationInterface {
  name = 'AddEventChatType1730000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."chats_type_enum" ADD VALUE IF NOT EXISTS 'event'
    `);
  }

  public down(): Promise<void> {
    // PostgreSQL does not support removing enum values; event chats stay typed as 'event'.
    return Promise.resolve();
  }
}
