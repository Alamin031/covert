import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductSlugIndex1733300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_products_slug_unique"
      ON "products" ("slug")
      WHERE "slug" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_products_slug_unique"
    `);
  }
}
