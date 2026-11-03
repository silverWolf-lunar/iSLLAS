-- ============================================================================
-- SLLAS — Add password_hash to users table & seed passwords via pgcrypto
-- Run this in the Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. Enable pgcrypto extension (needed for gen_salt / crypt)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Add password_hash column (if not already present)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

-- 3. Set bcrypt passwords for all seeded staff accounts
--    Default password for ALL staff: GovernmentSecure2026!
--    (Each account gets a unique salt even though the password is the same)
UPDATE "users"
  SET "password_hash" = crypt('GovernmentSecure2026!', gen_salt('bf', 12))
  WHERE "email" IN (
    'admin@sllas.gov.zw',
    'officer@sllas.gov.zw',
    'estates@sllas.gov.zw',
    'citizen@sllas.gov.zw',
    'approver@sllas.gov.zw'
  )
  AND "password_hash" IS NULL;

-- 3b. Seed miller@isllas.com System Administrator account
INSERT INTO "users" ("id", "email", "first_name", "last_name", "role", "status", "password_hash")
VALUES (
  '00000000-0000-0000-0000-000000000006',
  'miller@isllas.com',
  'Miller',
  'Administrator',
  'SYSTEM_ADMIN',
  'ACTIVE',
  crypt('myadmin', gen_salt('bf', 12))
)
ON CONFLICT ("email") DO UPDATE SET
  "password_hash" = EXCLUDED."password_hash",
  "role" = 'SYSTEM_ADMIN',
  "status" = 'ACTIVE';

-- 4. Verify
SELECT email, role, status,
  CASE WHEN password_hash IS NOT NULL THEN '✅ Password set' ELSE '❌ No password' END AS pw_status
FROM users
ORDER BY role;
