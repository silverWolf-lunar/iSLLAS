import { MigrationInterface, QueryRunner } from 'typeorm';

export class EstatesAndWaitingListSchema1700000004000 implements MigrationInterface {
  name = 'EstatesAndWaitingListSchema1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add ESTATES_OFFICER to role_enum
    await queryRunner.query(`
      ALTER TYPE "role_enum" ADD VALUE IF NOT EXISTS 'ESTATES_OFFICER';
    `);

    // 2. Add waiting_list_number, allocated_by, subdivision_details to lease_applications
    await queryRunner.query(`
      ALTER TABLE "lease_applications"
        ADD COLUMN IF NOT EXISTS "waiting_list_number" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "allocated_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS "subdivision_details" VARCHAR(255);

      CREATE INDEX IF NOT EXISTS "idx_lease_applications_waiting_list"
        ON "lease_applications"("waiting_list_number");
    `);

    // 3. Create sequence for sequential waiting list numbers (WL-YYYY-XXXX)
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS "waiting_list_seq" START 1001;
    `);

    // 4. Add documents JSONB column to client_profiles to store KYC files
    await queryRunner.query(`
      ALTER TABLE "client_profiles"
        ADD COLUMN IF NOT EXISTS "documents" JSONB DEFAULT '[]'::jsonb;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "role_id" IN (SELECT "id" FROM "roles" WHERE "name" = 'ESTATES_OFFICER');

      DELETE FROM "roles" WHERE "name" = 'ESTATES_OFFICER';

      ALTER TABLE "client_profiles" DROP COLUMN IF EXISTS "documents";

      DROP SEQUENCE IF EXISTS "waiting_list_seq";

      DROP INDEX IF EXISTS "idx_lease_applications_waiting_list";

      ALTER TABLE "lease_applications"
        DROP COLUMN IF EXISTS "subdivision_details",
        DROP COLUMN IF EXISTS "allocated_by",
        DROP COLUMN IF EXISTS "waiting_list_number";
    `);
  }
}
