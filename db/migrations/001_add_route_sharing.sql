-- Migration: Add Route Sharing Features
-- Date: 2025-10-27
-- Description: Adds share tokens, view tracking, and sharing analytics to routes

-- =====================================================
-- Add sharing columns to routes table
-- =====================================================

-- Add share_token column (12-char alphanumeric, unique)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS share_token VARCHAR(12) UNIQUE;

-- Add view tracking columns
ALTER TABLE routes ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- Create index for fast share token lookups
-- =====================================================

-- Only index non-null share tokens (for public routes)
CREATE INDEX IF NOT EXISTS idx_routes_share_token
ON routes(share_token)
WHERE share_token IS NOT NULL;

-- Index for public routes
CREATE INDEX IF NOT EXISTS idx_routes_is_public
ON routes(is_public)
WHERE is_public = true;

-- =====================================================
-- Function: Generate unique share token
-- =====================================================

CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS VARCHAR(12) AS $$
DECLARE
  chars VARCHAR := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  token VARCHAR(12) := '';
  i INTEGER;
  exists_count INTEGER;
BEGIN
  -- Try up to 10 times to generate unique token
  FOR attempt IN 1..10 LOOP
    token := '';

    -- Generate 12 random characters
    FOR i IN 1..12 LOOP
      token := token || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Check if token already exists
    SELECT COUNT(*) INTO exists_count
    FROM routes
    WHERE share_token = token;

    -- If unique, return it
    IF exists_count = 0 THEN
      RETURN token;
    END IF;
  END LOOP;

  -- If we couldn't generate unique token after 10 attempts, raise error
  RAISE EXCEPTION 'Could not generate unique share token after 10 attempts';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Increment view count for shared route
-- =====================================================

CREATE OR REPLACE FUNCTION increment_route_views(p_share_token VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE routes
  SET
    view_count = COALESCE(view_count, 0) + 1,
    last_viewed_at = CURRENT_TIMESTAMP
  WHERE share_token = p_share_token
    AND is_public = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Verification queries (run after migration)
-- =====================================================

-- Verify columns were added
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'routes'
--   AND column_name IN ('share_token', 'view_count', 'last_viewed_at');

-- Verify function exists
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_name IN ('generate_share_token', 'increment_route_views');

-- Test token generation
-- SELECT generate_share_token();
