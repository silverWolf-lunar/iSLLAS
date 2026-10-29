import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the application-to-lease workflow and database-level allocation guards.
 *
 * The partial unique index permits many drafts for a parcel, but only one live
 * application. The leases exclusion constraint independently prevents overlapping
 * lease periods even if an application flow is bypassed.
 */
export class ApplicationsAndLeasesSchema1700000002000 implements MigrationInterface {
  name = 'ApplicationsAndLeasesSchema1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "client_type_enum" AS ENUM ('INDIVIDUAL', 'BUSINESS');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "verification_status_enum" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "application_status_enum" AS ENUM (
          'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'INFO_REQUESTED', 'SITE_INSPECTION',
          'APPROVED', 'REJECTED', 'OFFER_ISSUED', 'ACCEPTED', 'AGREEMENT_SIGNED',
          'ACTIVE', 'WITHDRAWN'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "lease_status_enum" AS ENUM (
          'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'RENEWAL_REQUESTED', 'RENEWED', 'TERMINATED', 'SUSPENDED'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "currency_enum" AS ENUM ('ZWL', 'USD');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "client_profiles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "client_type" "client_type_enum" NOT NULL,
        "national_id_number" VARCHAR(50),
        "registration_number" VARCHAR(50),
        "company_name" VARCHAR(255),
        "tax_clearance_number" VARCHAR(100),
        "address" TEXT NOT NULL,
        "province_id" UUID NOT NULL REFERENCES "admin_areas"("id") ON DELETE RESTRICT,
        "district_id" UUID NOT NULL REFERENCES "admin_areas"("id") ON DELETE RESTRICT,
        "directors" JSONB,
        "verification_status" "verification_status_enum" NOT NULL DEFAULT 'UNVERIFIED',
        "verification_reason" TEXT,
        "verified_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "verified_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "client_profiles_identity_requirements" CHECK (
          ("client_type" = 'INDIVIDUAL' AND "national_id_number" IS NOT NULL)
          OR
          ("client_type" = 'BUSINESS' AND "registration_number" IS NOT NULL AND "company_name" IS NOT NULL)
        )
      );
      CREATE INDEX IF NOT EXISTS "idx_client_profiles_user" ON "client_profiles"("user_id");
      CREATE INDEX IF NOT EXISTS "idx_client_profiles_province" ON "client_profiles"("province_id");
      CREATE INDEX IF NOT EXISTS "idx_client_profiles_district" ON "client_profiles"("district_id");
      CREATE INDEX IF NOT EXISTS "idx_client_profiles_verification_status" ON "client_profiles"("verification_status");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lease_applications" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "application_number" VARCHAR(100) NOT NULL UNIQUE,
        "client_profile_id" UUID NOT NULL REFERENCES "client_profiles"("id") ON DELETE RESTRICT,
        "parcel_id" UUID NOT NULL REFERENCES "parcels"("id") ON DELETE RESTRICT,
        "activity_profile_id" UUID,
        "intended_activity" VARCHAR(255) NOT NULL,
        "business_plan_summary" TEXT NOT NULL,
        "requested_term_years" INT NOT NULL CHECK ("requested_term_years" BETWEEN 1 AND 99),
        "proposed_investment_usd" NUMERIC(14, 2),
        "expected_jobs_created" INT CHECK ("expected_jobs_created" >= 0),
        "status" "application_status_enum" NOT NULL DEFAULT 'DRAFT',
        "assigned_officer_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "approved_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "rejection_reason" TEXT,
        "submitted_at" TIMESTAMPTZ,
        "version" INT NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "idx_lease_applications_number" ON "lease_applications"("application_number");
      CREATE INDEX IF NOT EXISTS "idx_lease_applications_client" ON "lease_applications"("client_profile_id");
      CREATE INDEX IF NOT EXISTS "idx_lease_applications_parcel" ON "lease_applications"("parcel_id");
      CREATE INDEX IF NOT EXISTS "idx_lease_applications_status" ON "lease_applications"("status");

      -- An application is live from submission through agreement signing. Drafts are deliberately excluded.
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_live_application_per_parcel"
        ON "lease_applications"("parcel_id")
        WHERE "status" IN (
          'SUBMITTED', 'UNDER_REVIEW', 'INFO_REQUESTED', 'SITE_INSPECTION',
          'APPROVED', 'OFFER_ISSUED', 'ACCEPTED', 'AGREEMENT_SIGNED'
        );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "application_status_history" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "application_id" UUID NOT NULL REFERENCES "lease_applications"("id") ON DELETE CASCADE,
        "from_status" "application_status_enum",
        "to_status" "application_status_enum" NOT NULL,
        "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "reason" TEXT,
        "comments" TEXT,
        "metadata" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "idx_application_status_history_application"
        ON "application_status_history"("application_id", "created_at" ASC);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leases" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "lease_number" VARCHAR(100) NOT NULL UNIQUE,
        "application_id" UUID NOT NULL UNIQUE REFERENCES "lease_applications"("id") ON DELETE RESTRICT,
        "parcel_id" UUID NOT NULL REFERENCES "parcels"("id") ON DELETE RESTRICT,
        "client_profile_id" UUID NOT NULL REFERENCES "client_profiles"("id") ON DELETE RESTRICT,
        "lease_period" TSTZRANGE NOT NULL,
        "start_date" DATE NOT NULL,
        "end_date" DATE NOT NULL,
        "annual_rent" NUMERIC(14, 2) NOT NULL CHECK ("annual_rent" >= 0),
        "currency" "currency_enum" NOT NULL DEFAULT 'USD',
        "terms_conditions" TEXT,
        "status" "lease_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "approved_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "approved_at" TIMESTAMPTZ,
        "version" INT NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "leases_valid_period" CHECK ("end_date" > "start_date")
      );
      CREATE INDEX IF NOT EXISTS "idx_leases_number" ON "leases"("lease_number");
      CREATE INDEX IF NOT EXISTS "idx_leases_parcel" ON "leases"("parcel_id");
      CREATE INDEX IF NOT EXISTS "idx_leases_client" ON "leases"("client_profile_id");
      CREATE INDEX IF NOT EXISTS "idx_leases_status" ON "leases"("status");

      ALTER TABLE "leases" ADD CONSTRAINT "leases_no_overlapping_active_periods"
        EXCLUDE USING gist (
          "parcel_id" WITH =,
          "lease_period" WITH &&
        ) WHERE ("status" IN ('ACTIVE', 'EXPIRING_SOON', 'RENEWAL_REQUESTED', 'RENEWED', 'SUSPENDED'));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "leases";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "application_status_history";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lease_applications";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "client_profiles";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "currency_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "lease_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "application_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "verification_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "client_type_enum";`);
  }
}
