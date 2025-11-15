-- Migration: 014_add_tasks.sql
-- Phase 4: Task Management System

-- =====================================================
-- TRIP TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trip_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,

  -- Task data
  title TEXT NOT NULL,
  description TEXT,
  task_type VARCHAR(50) DEFAULT 'custom' CHECK (task_type IN (
    'book_hotel', 'book_restaurant', 'research', 'purchase_tickets', 'custom', 'pack', 'transport'
  )),

  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Related entities (for context)
  related_activity TEXT,
  related_day INTEGER,
  related_restaurant TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'cancelled'
  )),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN (
    'low', 'medium', 'high', 'urgent'
  )),
  due_date TIMESTAMP,

  -- Completion tracking
  completed_at TIMESTAMP,
  completion_notes TEXT,
  completion_proof JSONB, -- Booking confirmations, receipts, etc.

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_trip_tasks_route ON trip_tasks(route_id);
CREATE INDEX IF NOT EXISTS idx_trip_tasks_assigned_to ON trip_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_trip_tasks_status ON trip_tasks(status);
CREATE INDEX IF NOT EXISTS idx_trip_tasks_priority ON trip_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_trip_tasks_due_date ON trip_tasks(due_date) WHERE status != 'completed' AND status != 'cancelled';
CREATE INDEX IF NOT EXISTS idx_trip_tasks_itinerary ON trip_tasks(itinerary_id) WHERE itinerary_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trip_tasks_day ON trip_tasks(route_id, related_day) WHERE related_day IS NOT NULL;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_trip_tasks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_tasks_updated_at
  BEFORE UPDATE ON trip_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_tasks_timestamp();

-- Task completion notification trigger
CREATE OR REPLACE FUNCTION notify_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Auto-set completed_at if not already set
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at = NOW();
    END IF;

    -- Log to route_activity (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'route_activity') THEN
      INSERT INTO route_activity (route_id, user_id, action, description, metadata)
      VALUES (
        NEW.route_id,
        COALESCE(NEW.assigned_to, NEW.assigned_by),
        'task_completed',
        'Completed task: ' || NEW.title,
        jsonb_build_object(
          'task_id', NEW.id,
          'task_title', NEW.title,
          'task_type', NEW.task_type,
          'priority', NEW.priority
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_tasks_completion_notify
  BEFORE UPDATE ON trip_tasks
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION notify_task_completion();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE trip_tasks IS 'Task management for collaborative trip planning';
COMMENT ON COLUMN trip_tasks.task_type IS 'Type of task: book_hotel, book_restaurant, research, purchase_tickets, custom, pack, transport';
COMMENT ON COLUMN trip_tasks.status IS 'Task status: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN trip_tasks.priority IS 'Task priority: low, medium, high, urgent';
COMMENT ON COLUMN trip_tasks.completion_proof IS 'JSONB field for storing booking confirmations, receipts, etc.';
