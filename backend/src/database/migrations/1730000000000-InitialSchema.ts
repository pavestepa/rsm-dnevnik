import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1730000000000 implements MigrationInterface {
  name = 'InitialSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."media_kind_enum" AS ENUM('image', 'video', 'audio', 'avatar')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_status_enum" AS ENUM('pending', 'uploaded')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chats_type_enum" AS ENUM('direct', 'group')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chat_participants_role_enum" AS ENUM('member', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_type_enum" AS ENUM('text', 'image', 'video', 'audio')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_receipts_status_enum" AS ENUM('delivered', 'read')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "name" character varying(128) NOT NULL,
        "phone" character varying(32),
        "bio" character varying(256),
        "avatarMediaId" uuid,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "media" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "objectKey" character varying(512) NOT NULL,
        "bucket" character varying(128) NOT NULL,
        "kind" "public"."media_kind_enum" NOT NULL,
        "mimeType" character varying(128) NOT NULL,
        "size" integer NOT NULL,
        "status" "public"."media_status_enum" NOT NULL DEFAULT 'pending',
        "durationSeconds" double precision,
        "uploadedById" uuid NOT NULL,
        CONSTRAINT "UQ_media_objectKey" UNIQUE ("objectKey"),
        CONSTRAINT "PK_media" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_avatarMediaId"
      FOREIGN KEY ("avatarMediaId") REFERENCES "media"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "media"
      ADD CONSTRAINT "FK_media_uploadedById"
      FOREIGN KEY ("uploadedById") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "chats" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "type" "public"."chats_type_enum" NOT NULL,
        "title" character varying(128),
        "avatarMediaId" uuid,
        "createdById" uuid NOT NULL,
        "ownerId" uuid,
        CONSTRAINT "PK_chats" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "chats"
      ADD CONSTRAINT "FK_chats_avatarMediaId"
      FOREIGN KEY ("avatarMediaId") REFERENCES "media"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "chats"
      ADD CONSTRAINT "FK_chats_createdById"
      FOREIGN KEY ("createdById") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "chatId" uuid NOT NULL,
        "senderId" uuid NOT NULL,
        "type" "public"."messages_type_enum" NOT NULL,
        "text" text,
        "mediaId" uuid,
        "replyToId" uuid,
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT "PK_messages" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_messages_chatId_createdAt" ON "messages" ("chatId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_senderId" ON "messages" ("senderId")`,
    );

    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD CONSTRAINT "FK_messages_chatId"
      FOREIGN KEY ("chatId") REFERENCES "chats"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD CONSTRAINT "FK_messages_senderId"
      FOREIGN KEY ("senderId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD CONSTRAINT "FK_messages_mediaId"
      FOREIGN KEY ("mediaId") REFERENCES "media"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD CONSTRAINT "FK_messages_replyToId"
      FOREIGN KEY ("replyToId") REFERENCES "messages"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "chat_participants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "chatId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "role" "public"."chat_participants_role_enum" NOT NULL DEFAULT 'member',
        "lastReadMessageId" uuid,
        "leftAt" TIMESTAMPTZ,
        CONSTRAINT "UQ_chat_participants_chatId_userId" UNIQUE ("chatId", "userId"),
        CONSTRAINT "PK_chat_participants" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_chat_participants_userId" ON "chat_participants" ("userId")`,
    );

    await queryRunner.query(`
      ALTER TABLE "chat_participants"
      ADD CONSTRAINT "FK_chat_participants_chatId"
      FOREIGN KEY ("chatId") REFERENCES "chats"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_participants"
      ADD CONSTRAINT "FK_chat_participants_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_participants"
      ADD CONSTRAINT "FK_chat_participants_lastReadMessageId"
      FOREIGN KEY ("lastReadMessageId") REFERENCES "messages"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "message_receipts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "messageId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "status" "public"."message_receipts_status_enum" NOT NULL,
        "statusUpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_message_receipts_messageId_userId" UNIQUE ("messageId", "userId"),
        CONSTRAINT "PK_message_receipts" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_message_receipts_messageId" ON "message_receipts" ("messageId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_message_receipts_userId" ON "message_receipts" ("userId")`,
    );

    await queryRunner.query(`
      ALTER TABLE "message_receipts"
      ADD CONSTRAINT "FK_message_receipts_messageId"
      FOREIGN KEY ("messageId") REFERENCES "messages"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "message_receipts"
      ADD CONSTRAINT "FK_message_receipts_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying(128) NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "revokedAt" TIMESTAMPTZ,
        CONSTRAINT "UQ_refresh_tokens_tokenHash" UNIQUE ("tokenHash"),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_userId" ON "refresh_tokens" ("userId")`,
    );

    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD CONSTRAINT "FK_refresh_tokens_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_userId"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(
      `ALTER TABLE "message_receipts" DROP CONSTRAINT "FK_message_receipts_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_receipts" DROP CONSTRAINT "FK_message_receipts_messageId"`,
    );
    await queryRunner.query(`DROP TABLE "message_receipts"`);
    await queryRunner.query(
      `ALTER TABLE "chat_participants" DROP CONSTRAINT "FK_chat_participants_lastReadMessageId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_participants" DROP CONSTRAINT "FK_chat_participants_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_participants" DROP CONSTRAINT "FK_chat_participants_chatId"`,
    );
    await queryRunner.query(`DROP TABLE "chat_participants"`);
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_replyToId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_mediaId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_senderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_chatId"`,
    );
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_chats_createdById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_chats_avatarMediaId"`,
    );
    await queryRunner.query(`DROP TABLE "chats"`);
    await queryRunner.query(
      `ALTER TABLE "media" DROP CONSTRAINT "FK_media_uploadedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_avatarMediaId"`,
    );
    await queryRunner.query(`DROP TABLE "media"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP TYPE "public"."message_receipts_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."messages_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."chat_participants_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."chats_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."media_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."media_kind_enum"`);
  }
}
