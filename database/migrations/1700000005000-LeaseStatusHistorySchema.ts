import { MigrationInterface, QueryRunner } from 'typeorm';

export class LeaseStatusHistorySchema1700000005000 implements MigrationInterface {
  name = 'LeaseStatusHistorySchema1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lease_status_history" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "lease_id" UUID NOT NULL REFERENCES "leases"("id") ON DELETE CASCADE,
        "from_status" "lease_status_enum",
        "to_status" "lease_status_enum" NOT NULL,
        "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "reason" TEXT,
        "comments" TEXT,
        "metadata" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS "idx_lease_status_history_lease"
        ON "lease_status_history"("lease_id", "created_at" ASC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "lease_status_history";
    `);
  }
}
