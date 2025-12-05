-- =====================================================
-- PENDING EMAIL INVITATIONS SUPPORT
-- =====================================================
-- Allow inviting users by email before they have an account

-- Add invited_email column to store email for pending invitations
ALTER TABLE route_collaborators
ADD COLUMN IF NOT EXISTS invited_email VARCHAR(255);

-- Make user_id nullable to allow pending email invitations
ALTER TABLE route_collaborators
ALTER COLUMN user_id DROP NOT NULL;

-- Add index on invited_email for quick lookups when user signs up
CREATE INDEX IF NOT EXISTS idx_collaborators_invited_email
ON route_collaborators(invited_email) WHERE invited_email IS NOT NULL;

-- Add unique constraint to prevent duplicate invitations to same email
CREATE UNIQUE INDEX IF NOT EXISTS idx_collaborators_route_email
ON route_collaborators(route_id, invited_email) WHERE invited_email IS NOT NULL;

COMMENT ON COLUMN route_collaborators.invited_email IS 'Email address for pending invitations (user_id is null until they sign up)';
