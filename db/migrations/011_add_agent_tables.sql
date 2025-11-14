-- Migration: Add AI Agent Tables
-- Description: Creates tables for agent conversations, messages, vector memory, and user preferences

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for semantic memory
CREATE EXTENSION IF NOT EXISTS vector;

-- Agent conversation sessions
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  session_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_conversations_user ON agent_conversations(user_id);
CREATE INDEX idx_agent_conversations_session ON agent_conversations(session_id);
CREATE INDEX idx_agent_conversations_route ON agent_conversations(route_id);

-- Individual messages in conversations
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls JSONB,
  tool_results JSONB,
  context_snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_messages_conversation ON agent_messages(conversation_id);
CREATE INDEX idx_agent_messages_created ON agent_messages(created_at DESC);
CREATE INDEX idx_agent_messages_role ON agent_messages(role);

-- Vector embeddings for semantic memory (using pgvector)
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES agent_messages(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_memory_user ON agent_memory(user_id);
CREATE INDEX idx_agent_memory_created ON agent_memory(created_at DESC);

-- Create vector index for similarity search (using ivfflat)
CREATE INDEX idx_agent_memory_embedding ON agent_memory
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- User preferences learned by agent
CREATE TABLE IF NOT EXISTS agent_user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_preferences_user ON agent_user_preferences(user_id);

-- Proactive suggestions from agent
CREATE TABLE IF NOT EXISTS agent_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  suggestion_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_suggestions_route ON agent_suggestions(route_id)
  WHERE NOT dismissed AND (expires_at IS NULL OR expires_at > NOW());

CREATE INDEX idx_agent_suggestions_user ON agent_suggestions(user_id)
  WHERE NOT dismissed;

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_conversations_updated_at BEFORE UPDATE ON agent_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_preferences_updated_at BEFORE UPDATE ON agent_user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
