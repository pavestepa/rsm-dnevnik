import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageUserDeletions1730000008000 implements MigrationInterface {
  name = 'AddMessageUserDeletions1730000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "message_user_deletions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "messageId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        CONSTRAINT "PK_message_user_deletions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_message_user_deletions_message_user"
          UNIQUE ("messageId", "userId"),
        CONSTRAINT "FK_message_user_deletions_message"
          FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_message_user_deletions_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_message_user_deletions_userId"
      ON "message_user_deletions" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_message_user_deletions_userId"`);
    await queryRunner.query(`DROP TABLE "message_user_deletions"`);
  }
}
