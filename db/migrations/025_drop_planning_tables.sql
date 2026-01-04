-- Migration: Drop Planning Tables
-- Description: Remove planning feature tables (planning_routes, trip_plans, city_plans, plan_clusters, plan_items)
-- Date: 2025-12-19

-- Drop tables in correct order (respecting foreign key constraints)

-- First, drop plan_items (references city_plans and plan_clusters)
DROP TABLE IF EXISTS plan_items CASCADE;

-- Drop plan_clusters (references city_plans)
DROP TABLE IF EXISTS plan_clusters CASCADE;

-- Drop city_plans (references trip_plans)
DROP TABLE IF EXISTS city_plans CASCADE;

-- Drop trip_plans (references planning_routes)
DROP TABLE IF EXISTS trip_plans CASCADE;

-- Finally, drop planning_routes
DROP TABLE IF EXISTS planning_routes CASCADE;

-- Drop any related indexes (CASCADE should handle these, but being explicit)
DROP INDEX IF EXISTS idx_planning_routes_user_id;
DROP INDEX IF EXISTS idx_trip_plans_route_id;
DROP INDEX IF EXISTS idx_trip_plans_user_id;
DROP INDEX IF EXISTS idx_city_plans_trip_plan_id;
DROP INDEX IF EXISTS idx_plan_clusters_city_plan_id;
DROP INDEX IF EXISTS idx_plan_items_city_plan_id;
DROP INDEX IF EXISTS idx_plan_items_cluster_id;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully dropped all planning-related tables';
END $$;
