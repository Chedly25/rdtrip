-- RdTrip Database Schema
-- PostgreSQL schema for user accounts, routes, and search history

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- =====================================================
-- ROUTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  stops INTEGER NOT NULL,
  budget VARCHAR(50) NOT NULL,
  selected_agents TEXT[] NOT NULL,
  route_data JSONB NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster user route lookups
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_created_at ON routes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routes_is_favorite ON routes(user_id, is_favorite);

-- =====================================================
-- SEARCHES TABLE (Search History)
-- =====================================================
CREATE TABLE IF NOT EXISTS searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_params JSONB NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster user search history lookups
CREATE INDEX IF NOT EXISTS idx_searches_user_id ON searches(user_id);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);

-- =====================================================
-- FUNCTION: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for routes table
CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE QUERIES (for reference)
-- =====================================================

-- Get user by email
-- SELECT * FROM users WHERE email = 'user@example.com';

-- Get all routes for a user (most recent first)
-- SELECT * FROM routes WHERE user_id = 'uuid' ORDER BY created_at DESC LIMIT 10;

-- Get user's favorite routes
-- SELECT * FROM routes WHERE user_id = 'uuid' AND is_favorite = true ORDER BY created_at DESC;

-- Get recent searches for a user
-- SELECT * FROM searches WHERE user_id = 'uuid' ORDER BY created_at DESC LIMIT 20;

-- Get route with user info
-- SELECT r.*, u.email, u.name
-- FROM routes r
-- JOIN users u ON r.user_id = u.id
-- WHERE r.id = 'uuid';

-- Delete old searches (cleanup - keep last 90 days)
-- DELETE FROM searches WHERE created_at < NOW() - INTERVAL '90 days';

-- =====================================================
-- CITY DETAILS TABLE (Rich city information for modals)
-- =====================================================
CREATE TABLE IF NOT EXISTS city_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_name VARCHAR(255) NOT NULL UNIQUE,
  country VARCHAR(100),

  -- Hero section
  tagline TEXT,
  main_image_url TEXT,
  rating DECIMAL(2,1),
  recommended_duration VARCHAR(50),

  -- Why visit (AI-generated)
  why_visit TEXT,
  best_for JSONB, -- ["🍷 Foodies", "🏛️ History buffs"]

  -- Highlights (array of objects)
  highlights JSONB, -- [{ name, description, duration, rating, type, imageUrl }]

  -- Restaurants (array of objects)
  restaurants JSONB, -- [{ name, cuisine, priceRange, description, rating, specialty }]

  -- Hotels/neighborhoods (array of objects)
  accommodations JSONB, -- [{ areaName, description, priceFrom, bestFor }]

  -- Practical info
  parking_info TEXT,
  parking_difficulty VARCHAR(20), -- Easy, Moderate, Difficult
  environmental_zones JSONB, -- { hasRestrictions, type, description, advice }
  best_time_to_visit JSONB, -- { ideal, reasoning, avoid }
  events_festivals JSONB, -- [{ name, month, description }]
  local_tips JSONB, -- ["Get Lyon City Card", ...]
  warnings JSONB, -- ["Many places close in August", ...]

  -- Weather (optional, can be text summary)
  weather_overview TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_source VARCHAR(50) DEFAULT 'perplexity',

  -- Coordinates (for route calculations)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_city_details_city_name ON city_details(city_name);
CREATE INDEX IF NOT EXISTS idx_city_details_country ON city_details(country);

-- Trigger for city_details table
CREATE TRIGGER update_city_details_updated_at
  BEFORE UPDATE ON city_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PLANNING FEATURE TABLES (Phase 5)
-- =====================================================

-- Planning Routes: Simplified route storage for the planning feature
-- Uses string IDs (not UUID) for client-side generation
CREATE TABLE IF NOT EXISTS planning_routes (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255),
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  route_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_planning_routes_user_id ON planning_routes(user_id);

-- Trip Plans: Overall planning state for a route
CREATE TABLE IF NOT EXISTS trip_plans (
  id VARCHAR(100) PRIMARY KEY,
  route_id VARCHAR(100) NOT NULL REFERENCES planning_routes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'planning',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trip_plans_route_id ON trip_plans(route_id);
CREATE INDEX IF NOT EXISTS idx_trip_plans_user_id ON trip_plans(user_id);

-- City Plans: Planning data for each city in a trip
CREATE TABLE IF NOT EXISTS city_plans (
  id VARCHAR(100) PRIMARY KEY,
  trip_plan_id VARCHAR(100) NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
  city_id VARCHAR(100) NOT NULL,
  city_data JSONB NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_city_plans_trip_plan_id ON city_plans(trip_plan_id);

-- Plan Clusters: Geographic area clusters within a city
CREATE TABLE IF NOT EXISTS plan_clusters (
  id VARCHAR(100) PRIMARY KEY,
  city_plan_id VARCHAR(100) NOT NULL REFERENCES city_plans(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  center_lat DECIMAL(10, 8),
  center_lng DECIMAL(11, 8),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plan_clusters_city_plan_id ON plan_clusters(city_plan_id);

-- Plan Items: Individual places/activities in a cluster or unclustered
CREATE TABLE IF NOT EXISTS plan_items (
  id VARCHAR(100) PRIMARY KEY,
  city_plan_id VARCHAR(100) NOT NULL REFERENCES city_plans(id) ON DELETE CASCADE,
  cluster_id VARCHAR(100) REFERENCES plan_clusters(id) ON DELETE SET NULL,
  card_data JSONB NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plan_items_city_plan_id ON plan_items(city_plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_cluster_id ON plan_items(cluster_id);

-- Triggers for planning tables
CREATE TRIGGER update_planning_routes_updated_at
  BEFORE UPDATE ON planning_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_plans_updated_at
  BEFORE UPDATE ON trip_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
