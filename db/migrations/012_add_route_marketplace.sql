-- =====================================================
-- PHASE 4: Route Publishing & Marketplace Migration
-- =====================================================
-- Tables: published_routes, route_reviews, route_clones, route_collections
-- Features: Community marketplace, route templates, reviews, cloning
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =====================================================
-- PUBLISHED ROUTES TABLE (Public marketplace)
-- =====================================================
CREATE TABLE IF NOT EXISTS published_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Publishing metadata
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT,

  -- Route characteristics
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'moderate', 'challenging')),
  duration_days INTEGER NOT NULL,
  total_distance_km DECIMAL(10,2),
  cities_visited TEXT[],
  countries_visited TEXT[],

  -- Categorization
  primary_style VARCHAR(50), -- 'adventure', 'culture', 'food', 'hidden_gems', 'best-overall'
  tags TEXT[],
  best_season VARCHAR(20), -- 'spring', 'summer', 'fall', 'winter', 'year-round'

  -- Pricing (future premium templates)
  is_premium BOOLEAN DEFAULT false,
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  clone_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'unlisted', 'archived')),
  featured BOOLEAN DEFAULT false,

  -- SEO
  slug VARCHAR(255) UNIQUE NOT NULL,
  meta_description TEXT,

  -- Moderation
  is_moderated BOOLEAN DEFAULT false,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT valid_duration CHECK (duration_days > 0 AND duration_days <= 365),
  CONSTRAINT valid_distance CHECK (total_distance_km IS NULL OR total_distance_km > 0),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_price CHECK (price IS NULL OR price >= 0)
);

-- Indexes for performance
CREATE INDEX idx_published_routes_user_id ON published_routes(user_id);
CREATE INDEX idx_published_routes_status ON published_routes(status) WHERE status = 'published';
CREATE INDEX idx_published_routes_featured ON published_routes(featured) WHERE featured = true;
CREATE INDEX idx_published_routes_rating ON published_routes(rating DESC, review_count DESC);
CREATE INDEX idx_published_routes_clone_count ON published_routes(clone_count DESC);
CREATE INDEX idx_published_routes_created ON published_routes(created_at DESC);
CREATE INDEX idx_published_routes_tags ON published_routes USING GIN(tags);
CREATE INDEX idx_published_routes_slug ON published_routes(slug);
CREATE INDEX idx_published_routes_primary_style ON published_routes(primary_style) WHERE status = 'published';

-- Full-text search index
CREATE INDEX idx_published_routes_search ON published_routes
  USING GIN(to_tsvector('english', title || ' ' || description || ' ' || COALESCE(array_to_string(tags, ' '), '') || ' ' || COALESCE(array_to_string(cities_visited, ' '), '')));

-- Popular routes compound index
CREATE INDEX idx_published_routes_popular ON published_routes(clone_count DESC, rating DESC, view_count DESC)
  WHERE status = 'published';

-- =====================================================
-- ROUTE REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS route_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  published_route_id UUID REFERENCES published_routes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT NOT NULL,

  -- Helpful tracking (community votes)
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Trip context
  trip_completed_at DATE,
  traveled_with VARCHAR(50) CHECK (traveled_with IN ('solo', 'couple', 'family', 'friends', 'group')),

  -- Verification (did they actually complete this route?)
  is_verified BOOLEAN DEFAULT false,

  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- One review per user per route
  UNIQUE(published_route_id, user_id),

  -- Must have comment
  CONSTRAINT comment_not_empty CHECK (LENGTH(TRIM(comment)) >= 10)
);

CREATE INDEX idx_route_reviews_published_route ON route_reviews(published_route_id);
CREATE INDEX idx_route_reviews_user ON route_reviews(user_id);
CREATE INDEX idx_route_reviews_rating ON route_reviews(rating DESC);
CREATE INDEX idx_route_reviews_helpful ON route_reviews(helpful_count DESC);
CREATE INDEX idx_route_reviews_created ON route_reviews(created_at DESC);

-- =====================================================
-- ROUTE CLONES TABLE (Track who cloned what)
-- =====================================================
CREATE TABLE IF NOT EXISTS route_clones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  published_route_id UUID REFERENCES published_routes(id) ON DELETE CASCADE,
  original_route_id UUID REFERENCES routes(id) ON DELETE CASCADE, -- The published route
  cloned_route_id UUID REFERENCES routes(id) ON DELETE CASCADE, -- The user's copy
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Customization tracking
  modifications JSONB, -- Track what they changed
  has_modified BOOLEAN DEFAULT false,

  -- Trip completion
  trip_completed BOOLEAN DEFAULT false,
  trip_completed_at DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate clones
  UNIQUE(published_route_id, user_id)
);

CREATE INDEX idx_route_clones_published_route ON route_clones(published_route_id);
CREATE INDEX idx_route_clones_user ON route_clones(user_id);
CREATE INDEX idx_route_clones_created ON route_clones(created_at DESC);

-- =====================================================
-- ROUTE COLLECTIONS TABLE (Curated lists)
-- =====================================================
CREATE TABLE IF NOT EXISTS route_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT false,

  -- Stats
  route_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_route_collections_user ON route_collections(user_id);
CREATE INDEX idx_route_collections_public ON route_collections(is_public) WHERE is_public = true;

-- =====================================================
-- COLLECTION ROUTES TABLE (Many-to-many)
-- =====================================================
CREATE TABLE IF NOT EXISTS collection_routes (
  collection_id UUID REFERENCES route_collections(id) ON DELETE CASCADE,
  published_route_id UUID REFERENCES published_routes(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,

  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (collection_id, published_route_id)
);

CREATE INDEX idx_collection_routes_collection ON collection_routes(collection_id, position);
CREATE INDEX idx_collection_routes_published_route ON collection_routes(published_route_id);

-- =====================================================
-- REVIEW HELPFUL VOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  review_id UUID REFERENCES route_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL, -- true = helpful, false = not helpful

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (review_id, user_id)
);

CREATE INDEX idx_review_helpful_votes_review ON review_helpful_votes(review_id);

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Auto-update rating and review count when review added/updated/deleted
CREATE OR REPLACE FUNCTION update_published_route_rating() RETURNS TRIGGER AS $$
BEGIN
  UPDATE published_routes
  SET
    rating = COALESCE((SELECT AVG(rating)::decimal(3,2) FROM route_reviews WHERE published_route_id = COALESCE(NEW.published_route_id, OLD.published_route_id)), 0),
    review_count = (SELECT COUNT(*) FROM route_reviews WHERE published_route_id = COALESCE(NEW.published_route_id, OLD.published_route_id)),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = COALESCE(NEW.published_route_id, OLD.published_route_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_route_rating
  AFTER INSERT OR UPDATE OR DELETE ON route_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_published_route_rating();

-- Auto-increment clone count when route cloned
CREATE OR REPLACE FUNCTION increment_clone_count() RETURNS TRIGGER AS $$
BEGIN
  UPDATE published_routes
  SET
    clone_count = clone_count + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.published_route_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_clone_count
  AFTER INSERT ON route_clones
  FOR EACH ROW
  EXECUTE FUNCTION increment_clone_count();

-- Auto-update collection route count
CREATE OR REPLACE FUNCTION update_collection_route_count() RETURNS TRIGGER AS $$
BEGIN
  UPDATE route_collections
  SET
    route_count = (SELECT COUNT(*) FROM collection_routes WHERE collection_id = COALESCE(NEW.collection_id, OLD.collection_id)),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = COALESCE(NEW.collection_id, OLD.collection_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_count
  AFTER INSERT OR DELETE ON collection_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_route_count();

-- Auto-update helpful count on reviews
CREATE OR REPLACE FUNCTION update_review_helpful_count() RETURNS TRIGGER AS $$
BEGIN
  UPDATE route_reviews
  SET
    helpful_count = (SELECT COUNT(*) FROM review_helpful_votes WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) AND is_helpful = true),
    not_helpful_count = (SELECT COUNT(*) FROM review_helpful_votes WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) AND is_helpful = false)
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON review_helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_published_routes_updated_at
  BEFORE UPDATE ON published_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_route_reviews_updated_at
  BEFORE UPDATE ON route_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_route_collections_updated_at
  BEFORE UPDATE ON route_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View: Top rated routes
CREATE OR REPLACE VIEW top_rated_routes AS
SELECT
  pr.*,
  u.name as author_name,
  u.email as author_email,
  u.avatar_url as author_avatar
FROM published_routes pr
JOIN users u ON pr.user_id = u.id
WHERE pr.status = 'published'
  AND pr.review_count >= 3 -- Min 3 reviews to be considered
ORDER BY pr.rating DESC, pr.review_count DESC
LIMIT 100;

-- View: Trending routes (most cloned recently)
CREATE OR REPLACE VIEW trending_routes AS
SELECT
  pr.*,
  u.name as author_name,
  u.avatar_url as author_avatar,
  COUNT(rc.id) as recent_clones
FROM published_routes pr
JOIN users u ON pr.user_id = u.id
LEFT JOIN route_clones rc ON pr.id = rc.published_route_id
  AND rc.created_at > NOW() - INTERVAL '30 days'
WHERE pr.status = 'published'
GROUP BY pr.id, u.name, u.avatar_url
ORDER BY recent_clones DESC, pr.clone_count DESC
LIMIT 100;

-- View: Featured routes
CREATE OR REPLACE VIEW featured_routes AS
SELECT
  pr.*,
  u.name as author_name,
  u.avatar_url as author_avatar
FROM published_routes pr
JOIN users u ON pr.user_id = u.id
WHERE pr.status = 'published'
  AND pr.featured = true
ORDER BY pr.created_at DESC;

-- =====================================================
-- GRANTS (if needed)
-- =====================================================
-- GRANT ALL ON published_routes TO your_app_user;
-- GRANT ALL ON route_reviews TO your_app_user;
-- GRANT ALL ON route_clones TO your_app_user;
-- GRANT ALL ON route_collections TO your_app_user;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Verification queries:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('published_routes', 'route_reviews', 'route_clones', 'route_collections');
--
-- SELECT viewname FROM pg_views
-- WHERE viewname IN ('top_rated_routes', 'trending_routes', 'featured_routes');
