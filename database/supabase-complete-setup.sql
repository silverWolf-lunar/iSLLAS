-- ============================================================================
-- SLLAS (Smart Land Lease and Allocation System) — Supabase PostgreSQL Setup
-- Run this script directly in the Supabase Dashboard SQL Editor
-- ============================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Custom Enumerations
DO $$ BEGIN
  CREATE TYPE "role_enum" AS ENUM ('SYSTEM_ADMIN', 'REGISTRY_OFFICER', 'APPROVER', 'AUDITOR', 'CLIENT', 'ESTATES_OFFICER');
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

DO $$ BEGIN
  CREATE TYPE "parcel_status_enum" AS ENUM (
    'DRAFT', 'PENDING_VERIFICATION', 'AVAILABLE', 'RESERVED', 'ALLOCATED', 'LEASED', 'WITHDRAWN', 'DISPUTED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "soil_type_enum" AS ENUM (
    'CLAY', 'LOAM', 'SANDY', 'SILT', 'PEAT', 'CHALKY', 'MIXED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "natural_region_enum" AS ENUM (
    'I', 'II', 'III', 'IV', 'V'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "road_access_enum" AS ENUM (
    'TARRED', 'GRAVEL', 'DIRT_TRACK', 'NONE'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "terrain_enum" AS ENUM (
    'FLAT', 'GENTLY_UNDULATING', 'HILLY', 'MOUNTAINOUS', 'VALLEY'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

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

DO $$ BEGIN
  CREATE TYPE "notification_channel_enum" AS ENUM ('IN_APP', 'PUSH', 'EMAIL', 'SMS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "notification_delivery_status_enum" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'DLQ');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "recommendation_direction_enum" AS ENUM ('ACTIVITY_TO_PARCELS', 'PARCEL_TO_ACTIVITIES');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Core Tables
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
  "password_hash" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");

CREATE TABLE IF NOT EXISTS "user_identities" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" VARCHAR(50) NOT NULL DEFAULT 'keycloak',
  "provider_subject" VARCHAR(255) NOT NULL UNIQUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "audit_events" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "actor_email" VARCHAR(255) NOT NULL,
  "actor_role" VARCHAR(50) NOT NULL,
  "action" "audit_action_enum" NOT NULL,
  "entity_type" VARCHAR(100) NOT NULL,
  "entity_id" VARCHAR(255),
  "details" JSONB,
  "ip_address" VARCHAR(50),
  "user_agent" VARCHAR(255),
  "correlation_id" VARCHAR(100),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_audit_events_created_at" ON "audit_events"("created_at" DESC);

CREATE TABLE IF NOT EXISTS "outbox_events" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "aggregate_type" VARCHAR(100) NOT NULL,
  "aggregate_id" VARCHAR(255) NOT NULL,
  "event_type" VARCHAR(100) NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "outbox_status_enum" NOT NULL DEFAULT 'PENDING',
  "retry_count" INT NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "published_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "land_categories" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(100) NOT NULL UNIQUE,
  "code" VARCHAR(50) NOT NULL UNIQUE,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "parcels" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "reference_number" VARCHAR(100) NOT NULL UNIQUE,
  "province_id" UUID NOT NULL REFERENCES "admin_areas"("id") ON DELETE RESTRICT,
  "district_id" UUID NOT NULL REFERENCES "admin_areas"("id") ON DELETE RESTRICT,
  "ward_id" UUID REFERENCES "admin_areas"("id") ON DELETE SET NULL,
  "land_category_id" UUID NOT NULL REFERENCES "land_categories"("id") ON DELETE RESTRICT,
  "area_hectares" NUMERIC(14, 4) NOT NULL,
  "boundary" geometry(Polygon, 4326) NOT NULL,
  "boundary_geojson" JSONB NOT NULL,
  "centroid_lat" NUMERIC(10, 6),
  "centroid_lng" NUMERIC(10, 6),
  "status" "parcel_status_enum" NOT NULL DEFAULT 'DRAFT',
  "soil_type" "soil_type_enum",
  "natural_region" "natural_region_enum",
  "rainfall_band" VARCHAR(50),
  "water_access" BOOLEAN DEFAULT false,
  "water_sources" VARCHAR(255),
  "road_access" "road_access_enum" DEFAULT 'DIRT_TRACK',
  "electricity_available" BOOLEAN DEFAULT false,
  "grid_proximity_km" NUMERIC(6, 2),
  "terrain" "terrain_enum" DEFAULT 'FLAT',
  "current_use" VARCHAR(255) DEFAULT 'Idle / Unused',
  "previous_use" VARCHAR(255),
  "zoning_permitted_uses" VARCHAR(255),
  "restrictions" TEXT,
  "notes" TEXT,
  "registered_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "verified_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "verified_at" TIMESTAMPTZ,
  "rejection_reason" TEXT,
  "version" INT NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_parcels_boundary_gist" ON "parcels" USING GIST ("boundary");
CREATE INDEX IF NOT EXISTS "idx_parcels_status" ON "parcels"("status");
CREATE INDEX IF NOT EXISTS "idx_parcels_province" ON "parcels"("province_id");

CREATE TABLE IF NOT EXISTS "parcel_verifications" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "parcel_id" UUID NOT NULL REFERENCES "parcels"("id") ON DELETE CASCADE,
  "officer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "action" VARCHAR(50) NOT NULL,
  "notes" TEXT,
  "checklist" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  "documents" JSONB DEFAULT '[]'::jsonb,
  "verification_status" "verification_status_enum" NOT NULL DEFAULT 'UNVERIFIED',
  "verification_reason" TEXT,
  "verified_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "verified_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sequence for Sequential Waiting List Numbers (WL-YYYY-XXXX)
CREATE SEQUENCE IF NOT EXISTS "waiting_list_seq" START 1001;

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
  "waiting_list_number" VARCHAR(100),
  "allocated_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "subdivision_details" VARCHAR(255),
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
CREATE INDEX IF NOT EXISTS "idx_lease_applications_status" ON "lease_applications"("status");
CREATE INDEX IF NOT EXISTS "idx_lease_applications_waiting_list" ON "lease_applications"("waiting_list_number");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_live_application_per_parcel"
  ON "lease_applications"("parcel_id")
  WHERE "status" IN (
    'SUBMITTED', 'UNDER_REVIEW', 'INFO_REQUESTED', 'SITE_INSPECTION',
    'APPROVED', 'OFFER_ISSUED', 'ACCEPTED', 'AGREEMENT_SIGNED'
  );

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
CREATE INDEX IF NOT EXISTS "idx_leases_status" ON "leases"("status");

ALTER TABLE "leases" DROP CONSTRAINT IF EXISTS "leases_no_overlapping_active_periods";
ALTER TABLE "leases" ADD CONSTRAINT "leases_no_overlapping_active_periods"
  EXCLUDE USING gist (
    "parcel_id" WITH =,
    "lease_period" WITH &&
  ) WHERE ("status" IN ('ACTIVE', 'EXPIRING_SOON', 'RENEWAL_REQUESTED', 'RENEWED', 'SUSPENDED'));

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
CREATE INDEX IF NOT EXISTS "idx_lease_status_history_lease" ON "lease_status_history"("lease_id", "created_at" ASC);

CREATE TABLE IF NOT EXISTS "notification_templates" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "code" VARCHAR(100) NOT NULL UNIQUE,
  "channel" "notification_channel_enum" NOT NULL,
  "subject_template" VARCHAR(255),
  "body_template" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "version" INT NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "channel" "notification_channel_enum" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "uq_notification_preferences_user_channel" UNIQUE ("user_id", "channel")
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "channel" "notification_channel_enum" NOT NULL,
  "status" "notification_delivery_status_enum" NOT NULL DEFAULT 'QUEUED',
  "template_code" VARCHAR(100),
  "subject" VARCHAR(255),
  "body" TEXT NOT NULL,
  "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "deduplication_key" VARCHAR(255),
  "attempt_count" INT NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "sent_at" TIMESTAMPTZ,
  "read_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "activity_profiles" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(100) NOT NULL UNIQUE,
  "display_name" VARCHAR(150) NOT NULL,
  "description" TEXT,
  "hard_constraints" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "weighted_preferences" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "version" INT NOT NULL DEFAULT 1,
  "created_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "recommendation_runs" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "requested_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "direction" "recommendation_direction_enum" NOT NULL,
  "activity_profile_id" UUID REFERENCES "activity_profiles"("id") ON DELETE SET NULL,
  "parcel_id" UUID REFERENCES "parcels"("id") ON DELETE SET NULL,
  "activity_profile_version" INT,
  "input_filters" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "results" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "result_count" INT NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. Initial Zimbabwe Reference & Seed Data
-- ============================================================================

-- Roles
INSERT INTO "roles" ("name", "description") VALUES
  ('SYSTEM_ADMIN', 'Full system administration and configuration'),
  ('REGISTRY_OFFICER', 'Land parcel registration, verification, application review'),
  ('APPROVER', 'Senior land board approver for applications and leases'),
  ('AUDITOR', 'Read-only compliance and audit history inspector'),
  ('CLIENT', 'Citizen or business applicant for land leases'),
  ('ESTATES_OFFICER', 'Estates officer managing waiting lists and parcel allocations')
ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description";

-- Zimbabwe Provinces
INSERT INTO "admin_areas" ("code", "name", "level", "centroid_lat", "centroid_lng") VALUES
  ('ZW-HA', 'Harare', 'PROVINCE', -17.825166, 31.033510),
  ('ZW-BU', 'Bulawayo', 'PROVINCE', -20.150000, 28.583333),
  ('ZW-MC', 'Mashonaland Central', 'PROVINCE', -16.764400, 31.079400),
  ('ZW-ME', 'Mashonaland East', 'PROVINCE', -18.188700, 31.554700),
  ('ZW-MW', 'Mashonaland West', 'PROVINCE', -17.483300, 29.783300),
  ('ZW-MV', 'Masvingo', 'PROVINCE', -20.063700, 30.827700),
  ('ZW-MN', 'Manicaland', 'PROVINCE', -19.000000, 32.666700),
  ('ZW-MS', 'Matabeleland South', 'PROVINCE', -21.000000, 29.000000),
  ('ZW-MN-NORTH', 'Matabeleland North', 'PROVINCE', -18.500000, 27.500000),
  ('ZW-MI', 'Midlands', 'PROVINCE', -19.450000, 29.816700)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

-- Land Categories
INSERT INTO "land_categories" ("name", "code", "description") VALUES
  ('State Land', 'STATE_LAND', 'Gazetted government-held land managed by the Ministry of Lands and Agriculture'),
  ('Communal Land', 'COMMUNAL', 'Land administered under customary law and traditional authorities'),
  ('Resettlement (A1 Smallholder)', 'A1_RESETTLEMENT', 'Smallholder farming plots allocated for villagised or self-contained settlement'),
  ('Resettlement (A2 Commercial)', 'A2_COMMERCIAL', 'Medium to large-scale commercial farming plots under 99-year lease agreements'),
  ('Council Land', 'COUNCIL_LAND', 'Land designated for peri-urban or rural district council development')
ON CONFLICT ("code") DO NOTHING;

-- Activity Profiles
INSERT INTO "activity_profiles" ("name", "display_name", "description", "hard_constraints", "weighted_preferences") VALUES
  ('CROP_FARMING', 'Crop Farming', 'Field and staple crop production on land with suitable soil, water and access.',
    '{"minHectares":5,"waterAccess":true,"allowedNaturalRegions":["I","II","III"]}'::jsonb,
    '{"soil_suitability":{"weight":0.30,"preferred":["LOAM","CLAY"]},"natural_region":{"weight":0.25,"preferredOrder":["I","II","III"]},"road_access":{"weight":0.20,"preferredOrder":["TARRED","GRAVEL","DIRT_TRACK"]},"electricity":{"weight":0.10,"preferred":["true"]},"grid_proximity":{"weight":0.10,"maxKm":50},"rainfall":{"weight":0.05,"minMm":600}}'::jsonb),
  ('LIVESTOCK', 'Livestock Production', 'Grazing and livestock production requiring adequate land area and access.',
    '{"minHectares":20,"allowedNaturalRegions":["II","III","IV","V"]}'::jsonb,
    '{"natural_region":{"weight":0.35,"preferredOrder":["III","IV","II","V"]},"road_access":{"weight":0.25,"preferredOrder":["TARRED","GRAVEL","DIRT_TRACK"]},"water_access":{"weight":0.25,"preferred":["true"]},"grid_proximity":{"weight":0.15,"maxKm":80}}'::jsonb)
ON CONFLICT ("name") DO NOTHING;

-- Seed Default Administrative Users
INSERT INTO "users" ("id", "email", "first_name", "last_name", "role", "status", "password_hash") VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@sllas.gov.zw', 'System', 'Administrator', 'SYSTEM_ADMIN', 'ACTIVE', crypt('GovernmentSecure2026!', gen_salt('bf', 12))),
  ('00000000-0000-0000-0000-000000000002', 'officer@sllas.gov.zw', 'Tendai', 'Mutasa', 'REGISTRY_OFFICER', 'ACTIVE', crypt('GovernmentSecure2026!', gen_salt('bf', 12))),
  ('00000000-0000-0000-0000-000000000003', 'approver@sllas.gov.zw', 'Chipo', 'Sibanda', 'APPROVER', 'ACTIVE', crypt('GovernmentSecure2026!', gen_salt('bf', 12))),
  ('00000000-0000-0000-0000-000000000004', 'citizen@sllas.gov.zw', 'Farai', 'Moyo', 'CLIENT', 'ACTIVE', crypt('GovernmentSecure2026!', gen_salt('bf', 12))),
  ('00000000-0000-0000-0000-000000000005', 'estates@sllas.gov.zw', 'Kudakwashe', 'Ncube', 'ESTATES_OFFICER', 'ACTIVE', crypt('GovernmentSecure2026!', gen_salt('bf', 12))),
  ('00000000-0000-0000-0000-000000000006', 'miller@isllas.com', 'Miller', 'Administrator', 'SYSTEM_ADMIN', 'ACTIVE', crypt('myadmin', gen_salt('bf', 12)))
ON CONFLICT ("email") DO UPDATE SET
  "password_hash" = EXCLUDED."password_hash",
  "role" = EXCLUDED."role",
  "status" = EXCLUDED."status";

-- Seed Client Profile for Citizen
INSERT INTO "client_profiles" (
  "id", "user_id", "client_type", "national_id_number", "address",
  "province_id", "district_id", "verification_status"
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000004',
  'INDIVIDUAL',
  '63-123456-A-78',
  'Plot 14, Enterprise Road, Harare',
  (SELECT "id" FROM "admin_areas" WHERE "code" = 'ZW-HA'),
  (SELECT "id" FROM "admin_areas" WHERE "code" = 'ZW-HA'),
  'VERIFIED'
) ON CONFLICT ("user_id") DO NOTHING;

-- Seed Demonstrative Available / Idle Parcels
INSERT INTO "parcels" (
  "id", "reference_number", "province_id", "district_id", "land_category_id",
  "area_hectares", "boundary", "boundary_geojson", "centroid_lat", "centroid_lng",
  "status", "soil_type", "natural_region", "road_access", "water_access",
  "current_use", "registered_by"
) VALUES
  (
    '22222222-2222-2222-2222-222222220001',
    'ZW-HA-2024-001',
    (SELECT "id" FROM "admin_areas" WHERE "code" = 'ZW-HA'),
    (SELECT "id" FROM "admin_areas" WHERE "code" = 'ZW-HA'),
    (SELECT "id" FROM "land_categories" WHERE "code" = 'STATE_LAND'),
    25.50,
    ST_GeomFromText('POLYGON((31.00 -17.80, 31.02 -17.80, 31.02 -17.82, 31.00 -17.82, 31.00 -17.80))', 4326),
    '{"type":"Polygon","coordinates":[[[31.00,-17.80],[31.02,-17.80],[31.02,-17.82],[31.00,-17.82],[31.00,-17.80]]]}'::jsonb,
    -17.8100, 31.0100,
    'AVAILABLE', 'LOAM', 'II', 'TARRED', true, 'Idle / Unused',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '22222222-2222-2222-2222-222222220002',
    'ZW-MW-2024-042',
    (SELECT "id" FROM "admin_areas" WHERE "code" = 'ZW-MW'),
    (SELECT "id" FROM "admin_areas" WHERE "code" = 'ZW-MW'),
    (SELECT "id" FROM "land_categories" WHERE "code" = 'A2_COMMERCIAL'),
    150.00,
    ST_GeomFromText('POLYGON((29.75 -17.45, 29.78 -17.45, 29.78 -17.48, 29.75 -17.48, 29.75 -17.45))', 4326),
    '{"type":"Polygon","coordinates":[[[29.75,-17.45],[29.78,-17.45],[29.78,-17.48],[29.75,-17.48],[29.75,-17.45]]]}'::jsonb,
    -17.4650, 29.7650,
    'AVAILABLE', 'CLAY', 'II', 'GRAVEL', true, 'Idle / Unused',
    '00000000-0000-0000-0000-000000000002'
  ),
  (
    '22222222-2222-2222-2222-222222220003',
    'ZW-MN-2024-105',
    (SELECT "id" FROM "admin_areas" WHERE "code" = 'ZW-MN'),
    (SELECT "id" FROM "admin_areas" WHERE "code" = 'ZW-MN'),
    (SELECT "id" FROM "land_categories" WHERE "code" = 'A1_RESETTLEMENT'),
    12.00,
    ST_GeomFromText('POLYGON((32.65 -19.00, 32.67 -19.00, 32.67 -19.02, 32.65 -19.02, 32.65 -19.00))', 4326),
    '{"type":"Polygon","coordinates":[[[32.65,-19.00],[32.67,-19.00],[32.67,-19.02],[32.65,-19.02],[32.65,-19.00]]]}'::jsonb,
    -19.0100, 32.6600,
    'AVAILABLE', 'LOAM', 'I', 'TARRED', true, 'Idle / Unused',
    '00000000-0000-0000-0000-000000000002'
  )
ON CONFLICT ("reference_number") DO NOTHING;

-- Seed Waiting List Application
INSERT INTO "lease_applications" (
  "id", "application_number", "client_profile_id", "parcel_id",
  "intended_activity", "business_plan_summary", "requested_term_years",
  "proposed_investment_usd", "expected_jobs_created", "status",
  "waiting_list_number", "submitted_at"
) VALUES (
  '33333333-3333-3333-3333-333333330001',
  'APP-2024-0089',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222220001',
  'Horticulture & Maize Farming',
  'Commercial greenhouse and drip irrigation project focusing on export vegetables.',
  25,
  45000.00,
  14,
  'SUBMITTED',
  'WL-2024-1001',
  now() - INTERVAL '10 days'
) ON CONFLICT ("application_number") DO NOTHING;

SELECT 'SLLAS Supabase schema setup completed successfully! 🎉' AS status;
