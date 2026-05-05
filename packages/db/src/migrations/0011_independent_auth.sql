-- Migration: replace Lynk.id SSO with independent email/password auth
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Backfill existing rows so NOT NULL can be enforced
UPDATE tenants SET email = id::text || '@placeholder.aria' WHERE email IS NULL;
UPDATE tenants SET password_hash = '' WHERE password_hash IS NULL;

ALTER TABLE tenants
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN password_hash SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tenants_email_unique ON tenants(email);

ALTER TABLE tenants DROP COLUMN IF EXISTS lynk_user_id;
