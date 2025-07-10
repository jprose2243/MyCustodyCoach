-- =============================================
-- PARENTING TIME LOG SCHEMA
-- Track custody visits, missed visits, and notes
-- =============================================

-- Entry types for parenting time
CREATE TABLE IF NOT EXISTS parenting_entry_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL, -- Hex color for calendar display
  icon VARCHAR(10) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default entry types
INSERT INTO parenting_entry_types (name, color, icon, description) VALUES
('scheduled_visit', '#10B981', '✅', 'Scheduled parenting time that occurred as planned'),
('missed_visit_parent', '#EF4444', '❌', 'Visit missed due to parent not showing up'),
('missed_visit_child', '#F59E0B', '⚠️', 'Visit missed due to child being unavailable'),
('makeup_visit', '#8B5CF6', '🔄', 'Makeup visit for previously missed time'),
('early_return', '#6B7280', '⏰', 'Child returned early from scheduled visit'),
('extended_visit', '#0EA5E9', '📅', 'Visit extended beyond scheduled time'),
('note_only', '#6366F1', '📝', 'General note or observation (no visit)')
ON CONFLICT (name) DO NOTHING;

-- Main parenting time entries table
CREATE TABLE IF NOT EXISTS parenting_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type VARCHAR(50) NOT NULL REFERENCES parenting_entry_types(name),
  visit_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  child_name VARCHAR(100),
  location VARCHAR(200),
  notes TEXT,
  is_overnight BOOLEAN DEFAULT FALSE,
  weather VARCHAR(50),
  other_parent_present BOOLEAN DEFAULT FALSE,
  pickup_person VARCHAR(100), -- Who picked up the child
  dropoff_person VARCHAR(100), -- Who dropped off the child
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_parenting_time_user_date ON parenting_time_entries(user_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_parenting_time_type ON parenting_time_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_parenting_time_child ON parenting_time_entries(child_name);

-- Row Level Security
ALTER TABLE parenting_time_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own entries
CREATE POLICY "Users can view own parenting entries" ON parenting_time_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own entries
CREATE POLICY "Users can insert own parenting entries" ON parenting_time_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own entries
CREATE POLICY "Users can update own parenting entries" ON parenting_time_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own entries
CREATE POLICY "Users can delete own parenting entries" ON parenting_time_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Helper view for calendar display
CREATE OR REPLACE VIEW parenting_calendar_view AS
SELECT 
  pe.id,
  pe.user_id,
  pe.visit_date,
  pe.start_time,
  pe.end_time,
  pe.child_name,
  pe.location,
  pe.notes,
  pe.is_overnight,
  pe.other_parent_present,
  pe.created_at,
  pet.name as entry_type,
  pet.color,
  pet.icon,
  pet.description as type_description
FROM parenting_time_entries pe
JOIN parenting_entry_types pet ON pe.entry_type = pet.name
ORDER BY pe.visit_date DESC, pe.start_time DESC;

-- Statistics view for dashboard
CREATE OR REPLACE VIEW parenting_stats_view AS
SELECT 
  user_id,
  COUNT(*) as total_entries,
  COUNT(CASE WHEN entry_type = 'scheduled_visit' THEN 1 END) as successful_visits,
  COUNT(CASE WHEN entry_type IN ('missed_visit_parent', 'missed_visit_child') THEN 1 END) as missed_visits,
  COUNT(CASE WHEN entry_type = 'makeup_visit' THEN 1 END) as makeup_visits,
  COUNT(CASE WHEN is_overnight = true THEN 1 END) as overnight_visits,
  MIN(visit_date) as first_entry_date,
  MAX(visit_date) as last_entry_date
FROM parenting_time_entries
GROUP BY user_id;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_parenting_time_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_parenting_time_updated_at
  BEFORE UPDATE ON parenting_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_parenting_time_updated_at(); 