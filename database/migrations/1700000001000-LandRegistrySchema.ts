import { MigrationInterface, QueryRunner } from 'typeorm';

export class LandRegistrySchema1700000001000 implements MigrationInterface {
  name = 'LandRegistrySchema17000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums for Land Registry
    await queryRunner.query(`
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
    `);

    // 2. Land Categories Table (Configurable tenure categories)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "land_categories" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(100) NOT NULL UNIQUE,
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Seed standard Zimbabwe Land Categories
    await queryRunner.query(`
      INSERT INTO "land_categories" ("name", "code", "description")
      VALUES
        ('State Land', 'STATE_LAND', 'Gazetted government-held land managed by the Ministry of Lands and Agriculture'),
        ('Communal Land', 'COMMUNAL', 'Land administered under customary law and traditional authorities'),
        ('Resettlement (A1 Smallholder)', 'A1_RESETTLEMENT', 'Smallholder farming plots allocated for villagised or self-contained settlement'),
        ('Resettlement (A2 Commercial)', 'A2_COMMERCIAL', 'Medium to large-scale commercial farming plots under 99-year lease agreements'),
        ('Council Land', 'COUNCIL_LAND', 'Land designated for peri-urban or rural district council development'),
        ('Conservancy / Wildlife', 'CONSERVANCY', 'Designated safari, eco-tourism, or wildlife management areas')
      ON CONFLICT ("code") DO NOTHING;
    `);

    // 3. Land Parcels Table
    await queryRunner.query(`
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

      -- Spatial GIST Index on parcel boundary
      CREATE INDEX IF NOT EXISTS "idx_parcels_boundary_gist" ON "parcels" USING GIST ("boundary");

      -- B-Tree search and filtering indexes
      CREATE INDEX IF NOT EXISTS "idx_parcels_reference" ON "parcels"("reference_number");
      CREATE INDEX IF NOT EXISTS "idx_parcels_province" ON "parcels"("province_id");
      CREATE INDEX IF NOT EXISTS "idx_parcels_district" ON "parcels"("district_id");
      CREATE INDEX IF NOT EXISTS "idx_parcels_category" ON "parcels"("land_category_id");
      CREATE INDEX IF NOT EXISTS "idx_parcels_status" ON "parcels"("status");
      CREATE INDEX IF NOT EXISTS "idx_parcels_natural_region" ON "parcels"("natural_region");
      CREATE INDEX IF NOT EXISTS "idx_parcels_soil_type" ON "parcels"("soil_type");
      CREATE INDEX IF NOT EXISTS "idx_parcels_hectares" ON "parcels"("area_hectares");
    `);

    // 4. Parcel Verifications Log Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parcel_verifications" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "parcel_id" UUID NOT NULL REFERENCES "parcels"("id") ON DELETE CASCADE,
        "officer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "action" VARCHAR(50) NOT NULL,
        "notes" TEXT,
        "checklist" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS "idx_parcel_verifications_parcel_id" ON "parcel_verifications"("parcel_id");
      CREATE INDEX IF NOT EXISTS "idx_parcel_verifications_officer_id" ON "parcel_verifications"("officer_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "parcel_verifications";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parcels";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "land_categories";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "terrain_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "road_access_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "natural_region_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "soil_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "parcel_status_enum";`);
  }
}
