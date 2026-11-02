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

-- 4. Verify
SELECT email, role, status,
  CASE WHEN password_hash IS NOT NULL THEN '✅ Password set' ELSE '❌ No password' END AS pw_status
FROM users
ORDER BY role;
