import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationsAndRecommendationsSchema1700000003000 implements MigrationInterface {
  name = 'NotificationsAndRecommendationsSchema1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "notification_channel_enum" AS ENUM ('IN_APP', 'PUSH', 'EMAIL', 'SMS');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE "notification_delivery_status_enum" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'DLQ');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE "recommendation_direction_enum" AS ENUM ('ACTIVITY_TO_PARCELS', 'PARCEL_TO_ACTIVITIES');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
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
      CREATE INDEX IF NOT EXISTS "idx_notifications_user_created" ON "notifications"("user_id", "created_at" DESC);
      CREATE INDEX IF NOT EXISTS "idx_notifications_status" ON "notifications"("status", "created_at" ASC);
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_notification_deduplication"
        ON "notifications"("user_id", "deduplication_key")
        WHERE "deduplication_key" IS NOT NULL;
    `);

    await queryRunner.query(`
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
      CREATE INDEX IF NOT EXISTS "idx_activity_profiles_active" ON "activity_profiles"("is_active");

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
      CREATE INDEX IF NOT EXISTS "idx_recommendation_runs_requested_by" ON "recommendation_runs"("requested_by", "created_at" DESC);
      CREATE INDEX IF NOT EXISTS "idx_recommendation_runs_profile" ON "recommendation_runs"("activity_profile_id", "created_at" DESC);
    `);

    await queryRunner.query(`
      INSERT INTO "notification_templates" ("code", "channel", "subject_template", "body_template") VALUES
        ('LEASE_EXPIRING_SOON', 'IN_APP', 'Lease {{leaseNumber}} is expiring soon', 'Your lease for parcel {{parcelReference}} expires on {{endDate}}.'),
        ('LEASE_EXPIRED', 'IN_APP', 'Lease {{leaseNumber}} has expired', 'Your lease for parcel {{parcelReference}} expired on {{endDate}}. Contact the registry to discuss next steps.')
      ON CONFLICT ("code") DO NOTHING;

      INSERT INTO "activity_profiles" ("name", "display_name", "description", "hard_constraints", "weighted_preferences") VALUES
        ('CROP_FARMING', 'Crop Farming', 'Field and staple crop production on land with suitable soil, water and access.',
          '{"minHectares":5,"waterAccess":true,"allowedNaturalRegions":["I","II","III"]}'::jsonb,
          '{"soil_suitability":{"weight":0.30,"preferred":["LOAM","CLAY"]},"natural_region":{"weight":0.25,"preferredOrder":["I","II","III"]},"road_access":{"weight":0.20,"preferredOrder":["TARRED","GRAVEL","DIRT_TRACK"]},"electricity":{"weight":0.10,"preferred":["true"]},"grid_proximity":{"weight":0.10,"maxKm":50},"rainfall":{"weight":0.05,"minMm":600}}'::jsonb),
        ('LIVESTOCK', 'Livestock Production', 'Grazing and livestock production requiring adequate land area and access.',
          '{"minHectares":20,"allowedNaturalRegions":["II","III","IV","V"]}'::jsonb,
          '{"natural_region":{"weight":0.35,"preferredOrder":["III","IV","II","V"]},"road_access":{"weight":0.25,"preferredOrder":["TARRED","GRAVEL","DIRT_TRACK"]},"water_access":{"weight":0.25,"preferred":["true"]},"grid_proximity":{"weight":0.15,"maxKm":80}}'::jsonb)
      ON CONFLICT ("name") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "recommendation_runs";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_profiles";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_preferences";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_templates";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "recommendation_direction_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_delivery_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_channel_enum";`);
  }
}
