-- ─────────────────────────────────────────────────────────────
-- SLLAS Database Initialization Script
-- Run automatically on first PostgreSQL container start
-- ─────────────────────────────────────────────────────────────

-- Create Keycloak schema (Keycloak manages its own tables)
CREATE SCHEMA IF NOT EXISTS keycloak;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Verify extensions
DO $$
BEGIN
  RAISE NOTICE 'PostGIS version: %', PostGIS_Version();
  RAISE NOTICE 'Extensions installed successfully';
END $$;
