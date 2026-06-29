import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvents1730000009000 implements MigrationInterface {
  name = 'AddEvents1730000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."media_kind_enum" ADD VALUE IF NOT EXISTS 'document'
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."event_media_kind_enum" AS ENUM('image', 'file')
    `);

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "title" varchar(256) NOT NULL,
        "body" text NOT NULL DEFAULT '',
        "createdById" uuid NOT NULL,
        "groupChatId" uuid NOT NULL,
        "chatId" uuid NOT NULL,
        CONSTRAINT "PK_events" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_events_chatId" UNIQUE ("chatId"),
        CONSTRAINT "FK_events_createdBy" FOREIGN KEY ("createdById")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_events_groupChat" FOREIGN KEY ("groupChatId")
          REFERENCES "chats"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_events_chat" FOREIGN KEY ("chatId")
          REFERENCES "chats"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_events_groupChatId" ON "events" ("groupChatId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_events_createdAt" ON "events" ("createdAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_events_deletedAt" ON "events" ("deletedAt")
    `);

    await queryRunner.query(`
      CREATE TABLE "event_media" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "eventId" uuid NOT NULL,
        "mediaId" uuid NOT NULL,
        "kind" "public"."event_media_kind_enum" NOT NULL,
        "sortOrder" int NOT NULL DEFAULT 0,
        "fileName" varchar(256),
        CONSTRAINT "PK_event_media" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_event_media_event_media" UNIQUE ("eventId", "mediaId"),
        CONSTRAINT "FK_event_media_event" FOREIGN KEY ("eventId")
          REFERENCES "events"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_event_media_media" FOREIGN KEY ("mediaId")
          REFERENCES "media"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_event_media_eventId" ON "event_media" ("eventId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_event_media_eventId"`);
    await queryRunner.query(`DROP TABLE "event_media"`);
    await queryRunner.query(`DROP INDEX "IDX_events_deletedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_events_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_events_groupChatId"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TYPE "public"."event_media_kind_enum"`);
  }
}
