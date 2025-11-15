-- Migration: 011_add_message_reactions.sql
-- Phase 1: Enhanced Real-time Chat - Message Reactions, Threading, Mentions

-- Add reactions column to existing trip_messages table
ALTER TABLE trip_messages
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES trip_messages(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS mentioned_users UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS message_metadata JSONB DEFAULT '{}';

-- Create index for threaded conversations
CREATE INDEX IF NOT EXISTS idx_trip_messages_parent ON trip_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

-- Create index for mentions
CREATE INDEX IF NOT EXISTS idx_trip_messages_mentions ON trip_messages USING GIN(mentioned_users) WHERE mentioned_users IS NOT NULL AND array_length(mentioned_users, 1) > 0;

-- Create index for reactions queries
CREATE INDEX IF NOT EXISTS idx_trip_messages_reactions ON trip_messages USING GIN(reactions) WHERE reactions IS NOT NULL AND jsonb_array_length(reactions) > 0;

-- Add helpful comment
COMMENT ON COLUMN trip_messages.reactions IS 'Array of reaction objects: [{"emoji": "👍", "userId": "uuid", "createdAt": "timestamp"}]';
COMMENT ON COLUMN trip_messages.parent_message_id IS 'Parent message ID for threaded conversations';
COMMENT ON COLUMN trip_messages.mentioned_users IS 'Array of user IDs mentioned in message with @ syntax';
COMMENT ON COLUMN trip_messages.message_metadata IS 'Additional metadata: rich content (activities, links, images), formatting, etc.';
