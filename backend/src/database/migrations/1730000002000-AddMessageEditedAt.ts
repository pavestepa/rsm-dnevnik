import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageEditedAt1730000002000 implements MigrationInterface {
  name = 'AddMessageEditedAt1730000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD COLUMN "editedAt" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "editedAt"`);
  }
}
