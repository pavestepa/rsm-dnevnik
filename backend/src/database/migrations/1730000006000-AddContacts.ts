import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContacts1730000006000 implements MigrationInterface {
  name = 'AddContacts1730000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "contacts_source_enum" AS ENUM ('manual', 'device')
    `);

    await queryRunner.query(`
      CREATE TABLE "contacts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "ownerUserId" uuid NOT NULL,
        "phone" varchar(32) NOT NULL,
        "displayName" varchar(128) NOT NULL,
        "matchedUserId" uuid,
        "source" "contacts_source_enum" NOT NULL DEFAULT 'manual',
        CONSTRAINT "PK_contacts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_contacts_owner_phone" UNIQUE ("ownerUserId", "phone"),
        CONSTRAINT "FK_contacts_owner" FOREIGN KEY ("ownerUserId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_contacts_matched_user" FOREIGN KEY ("matchedUserId")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_contacts_ownerUserId" ON "contacts" ("ownerUserId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_contacts_ownerUserId"`);
    await queryRunner.query(`DROP TABLE "contacts"`);
    await queryRunner.query(`DROP TYPE "contacts_source_enum"`);
  }
}
