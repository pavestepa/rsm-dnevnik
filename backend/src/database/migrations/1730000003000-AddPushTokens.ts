import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPushTokens1730000003000 implements MigrationInterface {
  name = 'AddPushTokens1730000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."push_tokens_platform_enum" AS ENUM('ios', 'android')
    `);
    await queryRunner.query(`
      CREATE TABLE "push_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "expoPushToken" character varying(512) NOT NULL,
        "platform" "public"."push_tokens_platform_enum" NOT NULL,
        "lastUsedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_push_tokens_expoPushToken" UNIQUE ("expoPushToken"),
        CONSTRAINT "PK_push_tokens" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_push_tokens_userId" ON "push_tokens" ("userId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "push_tokens"
      ADD CONSTRAINT "FK_push_tokens_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "push_tokens" DROP CONSTRAINT "FK_push_tokens_userId"`,
    );
    await queryRunner.query(`DROP TABLE "push_tokens"`);
    await queryRunner.query(`DROP TYPE "public"."push_tokens_platform_enum"`);
  }
}
