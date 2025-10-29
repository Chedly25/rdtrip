-- Rollback Migration: Remove Google OAuth fields from users table
-- Date: 2025-10-29
-- Purpose: Revert to state before Google OAuth was added

-- Drop Google OAuth columns
ALTER TABLE users
  DROP COLUMN IF EXISTS google_id,
  DROP COLUMN IF EXISTS google_email,
  DROP COLUMN IF EXISTS google_name,
  DROP COLUMN IF EXISTS google_picture,
  DROP COLUMN IF EXISTS google_access_token,
  DROP COLUMN IF EXISTS google_refresh_token,
  DROP COLUMN IF EXISTS google_token_expiry;

-- Drop index for Google email lookups
DROP INDEX IF EXISTS idx_users_google_email;

-- Restore NOT NULL constraint on password_hash
-- (Can't do this safely if there are Google OAuth users, so skip this)
-- ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
