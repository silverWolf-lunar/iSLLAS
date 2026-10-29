import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialPlatformSchema1700000000000 implements MigrationInterface {
  name = 'InitialPlatformSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis";`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist";`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);

    // 2. Custom Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "role_enum" AS ENUM ('SYSTEM_ADMIN', 'REGISTRY_OFFICER', 'APPROVER', 'AUDITOR', 'CLIENT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "user_status_enum" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "office_level_enum" AS ENUM ('NATIONAL', 'PROVINCIAL', 'DISTRICT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "admin_area_level_enum" AS ENUM ('PROVINCE', 'DISTRICT', 'WARD');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "outbox_status_enum" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "audit_action_enum" AS ENUM (
          'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT',
          'VERIFY', 'APPROVE', 'REJECT', 'UPLOAD', 'DOWNLOAD', 'EXPORT', 'IMPORT'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 3. Admin Areas (Provinces, Districts, Wards)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_areas" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(150) NOT NULL,
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "level" "admin_area_level_enum" NOT NULL,
        "parent_id" UUID REFERENCES "admin_areas"("id") ON DELETE SET NULL,
        "centroid_lat" NUMERIC(10, 6),
        "centroid_lng" NUMERIC(10, 6),
        "boundary" geometry(Polygon, 4326),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "idx_admin_area_level" ON "admin_areas"("level");
      CREATE INDEX IF NOT EXISTS "idx_admin_area_parent_id" ON "admin_areas"("parent_id");
    `);

    // 4. Organizations (Offices)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organizations" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) NOT NULL,
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "level" "office_level_enum" NOT NULL DEFAULT 'PROVINCIAL',
        "province_id" UUID REFERENCES "admin_areas"("id") ON DELETE SET NULL,
        "district_id" UUID REFERENCES "admin_areas"("id") ON DELETE SET NULL,
        "address" VARCHAR(500),
        "phone_number" VARCHAR(50),
        "email" VARCHAR(255),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "idx_offices_level" ON "organizations"("level");
      CREATE INDEX IF NOT EXISTS "idx_offices_province" ON "organizations"("province_id");
    `);

    // 5. Roles & Permissions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" "role_enum" NOT NULL UNIQUE,
        "description" VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" VARCHAR(100) NOT NULL UNIQUE,
        "module" VARCHAR(100) NOT NULL,
        "description" VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "role_id" UUID REFERENCES "roles"("id") ON DELETE CASCADE,
        "permission_id" UUID REFERENCES "permissions"("id") ON DELETE CASCADE,
        PRIMARY KEY ("role_id", "permission_id")
      );
    `);

    // 6. Users
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "phone_number" VARCHAR(50),
        "role" "role_enum" NOT NULL DEFAULT 'CLIENT',
        "status" "user_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "office_id" UUID REFERENCES "organizations"("id") ON DELETE SET NULL,
        "province_id" UUID REFERENCES "admin_areas"("id") ON DELETE SET NULL,
        "district_id" UUID REFERENCES "admin_areas"("id") ON DELETE SET NULL,
        "last_login_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
      CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
      CREATE INDEX IF NOT EXISTS "idx_users_office_id" ON "users"("office_id");
      CREATE INDEX IF NOT EXISTS "idx_users_province_id" ON "users"("province_id");
    `);

    // 7. User Identities (Keycloak link)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_identities" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "provider" VARCHAR(50) NOT NULL DEFAULT 'keycloak',
        "provider_subject" VARCHAR(255) NOT NULL UNIQUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "idx_user_identities_user_id" ON "user_identities"("user_id");
    `);

    // 8. Audit Events (Append-only)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_events" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "actor_email" VARCHAR(255),
        "actor_role" VARCHAR(50),
        "action" "audit_action_enum" NOT NULL,
        "entity_type" VARCHAR(100) NOT NULL,
        "entity_id" VARCHAR(255) NOT NULL,
        "province_id" UUID REFERENCES "admin_areas"("id") ON DELETE SET NULL,
        "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "ip_address" VARCHAR(45),
        "user_agent" VARCHAR(500),
        "correlation_id" VARCHAR(100),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "idx_audit_actor_id" ON "audit_events"("actor_id");
      CREATE INDEX IF NOT EXISTS "idx_audit_action" ON "audit_events"("action");
      CREATE INDEX IF NOT EXISTS "idx_audit_entity_type" ON "audit_events"("entity_type");
      CREATE INDEX IF NOT EXISTS "idx_audit_entity_id" ON "audit_events"("entity_id");
      CREATE INDEX IF NOT EXISTS "idx_audit_created_at" ON "audit_events"("created_at" DESC);
    `);

    // 9. Outbox Events
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "outbox_events" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "event_type" VARCHAR(100) NOT NULL,
        "aggregate_type" VARCHAR(100) NOT NULL,
        "aggregate_id" VARCHAR(255) NOT NULL,
        "payload" JSONB NOT NULL,
        "status" "outbox_status_enum" NOT NULL DEFAULT 'PENDING',
        "retry_count" INT NOT NULL DEFAULT 0,
        "error_message" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "published_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_outbox_status" ON "outbox_events"("status");
      CREATE INDEX IF NOT EXISTS "idx_outbox_created_at" ON "outbox_events"("created_at" ASC);
    `);

    // 10. Idempotency Keys table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "idempotency_keys" (
        "key" VARCHAR(255) PRIMARY KEY,
        "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
        "response_status" INT NOT NULL,
        "response_body" JSONB NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMPTZ NOT NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "idempotency_keys";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "outbox_events";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_events";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_identities";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_areas";`);
  }
}
