-- =====================================================
-- PHASE 3: Expense Tracking & Splitting Migration
-- =====================================================
-- Tables: trip_expenses, expense_settlements, trip_budgets
-- Views: expense_summary_by_user, user_balances, budget_vs_actual
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TRIP EXPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trip_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE SET NULL,

  -- Who paid
  paid_by UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Expense details
  description VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'accommodation', 'food', 'transportation', 'activities',
    'shopping', 'fuel', 'tolls', 'parking', 'other'
  )),

  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  amount_eur DECIMAL(10,2), -- Converted for calculations

  -- Date and location
  expense_date DATE NOT NULL,
  location VARCHAR(255),
  city_name VARCHAR(100),

  -- Receipt
  receipt_url TEXT,
  receipt_data JSONB, -- OCR extracted data

  -- Splitting
  split_method VARCHAR(20) DEFAULT 'equal' CHECK (split_method IN (
    'equal', 'percentage', 'shares', 'custom'
  )),
  split_data JSONB, -- { userId: amount } for custom splits
  participants UUID[], -- Array of user IDs sharing this expense

  -- AI categorization
  ai_suggested_category VARCHAR(50),
  ai_confidence DECIMAL(3,2),
  is_ai_categorized BOOLEAN DEFAULT false,

  -- Metadata
  notes TEXT,
  tags TEXT[],
  is_reimbursed BOOLEAN DEFAULT false,
  reimbursement_status JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_participants CHECK (ARRAY_LENGTH(participants, 1) > 0)
);

-- Indexes for trip_expenses
CREATE INDEX IF NOT EXISTS idx_trip_expenses_route_id ON trip_expenses(route_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_paid_by ON trip_expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_expense_date ON trip_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_category ON trip_expenses(category);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_participants ON trip_expenses USING GIN(participants);

-- =====================================================
-- EXPENSE SETTLEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS expense_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,

  -- Who owes whom
  debtor UUID REFERENCES users(id) ON DELETE CASCADE,
  creditor UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'cancelled'
  )),
  settled_at TIMESTAMP WITH TIME ZONE,

  -- Payment tracking
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT different_users CHECK (debtor != creditor),
  CONSTRAINT positive_settlement CHECK (amount > 0)
);

-- Indexes for expense_settlements
CREATE INDEX IF NOT EXISTS idx_settlements_route_id ON expense_settlements(route_id);
CREATE INDEX IF NOT EXISTS idx_settlements_debtor ON expense_settlements(debtor);
CREATE INDEX IF NOT EXISTS idx_settlements_creditor ON expense_settlements(creditor);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON expense_settlements(status);

-- =====================================================
-- TRIP BUDGETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trip_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,

  -- Budget per category
  category VARCHAR(50) NOT NULL,
  budgeted_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Alerts
  alert_threshold DECIMAL(3,2) DEFAULT 0.80, -- Alert at 80%
  alert_sent BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(route_id, category),
  CONSTRAINT positive_budget CHECK (budgeted_amount > 0),
  CONSTRAINT valid_threshold CHECK (alert_threshold > 0 AND alert_threshold <= 1)
);

-- Index for trip_budgets
CREATE INDEX IF NOT EXISTS idx_trip_budgets_route_id ON trip_budgets(route_id);

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View: Expense summary per user
CREATE OR REPLACE VIEW expense_summary_by_user AS
SELECT
  e.route_id,
  e.paid_by as user_id,
  COUNT(*) as expense_count,
  SUM(e.amount_eur) as total_paid,
  AVG(e.amount_eur) as avg_expense,
  e.category,
  COUNT(*) FILTER (WHERE e.is_ai_categorized = true) as ai_categorized_count
FROM trip_expenses e
GROUP BY e.route_id, e.paid_by, e.category;

-- View: Balance calculation (who owes whom)
CREATE OR REPLACE VIEW user_balances AS
WITH expense_shares AS (
  SELECT
    route_id,
    paid_by,
    UNNEST(participants) as participant,
    CASE
      WHEN split_method = 'equal' THEN amount_eur / ARRAY_LENGTH(participants, 1)
      WHEN split_method = 'custom' AND split_data IS NOT NULL
        THEN COALESCE((split_data->>CAST(UNNEST(participants) AS TEXT))::decimal, 0)
      ELSE amount_eur / ARRAY_LENGTH(participants, 1)
    END as share_amount
  FROM trip_expenses
  WHERE amount_eur IS NOT NULL
)
SELECT
  route_id,
  participant as user_id,
  SUM(CASE WHEN participant = paid_by THEN 0 ELSE -share_amount END) +
  SUM(CASE WHEN participant != paid_by THEN 0 ELSE share_amount END) as balance
FROM expense_shares
GROUP BY route_id, participant;

-- View: Budget vs actual spending
CREATE OR REPLACE VIEW budget_vs_actual AS
SELECT
  b.id as budget_id,
  b.route_id,
  b.category,
  b.budgeted_amount,
  b.currency,
  COALESCE(SUM(e.amount_eur), 0) as actual_spent,
  b.budgeted_amount - COALESCE(SUM(e.amount_eur), 0) as remaining,
  CASE
    WHEN b.budgeted_amount > 0 THEN (COALESCE(SUM(e.amount_eur), 0) / b.budgeted_amount)
    ELSE 0
  END as spend_percentage,
  b.alert_threshold,
  b.alert_sent
FROM trip_budgets b
LEFT JOIN trip_expenses e ON b.route_id = e.route_id AND b.category = e.category
GROUP BY b.id, b.route_id, b.category, b.budgeted_amount, b.currency, b.alert_threshold, b.alert_sent;

-- =====================================================
-- GRANTS (if needed for specific users)
-- =====================================================
-- GRANT ALL ON trip_expenses TO your_app_user;
-- GRANT ALL ON expense_settlements TO your_app_user;
-- GRANT ALL ON trip_budgets TO your_app_user;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Run verification:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('trip_expenses', 'expense_settlements', 'trip_budgets');
--
-- SELECT viewname FROM pg_views
-- WHERE viewname IN ('expense_summary_by_user', 'user_balances', 'budget_vs_actual');
