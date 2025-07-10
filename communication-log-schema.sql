-- =============================================
-- COMMUNICATION LOG SCHEMA
-- Track all custody-related communications with comprehensive metadata
-- =============================================

-- Communication types (8 predefined types)
CREATE TABLE IF NOT EXISTS communication_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  color VARCHAR(50) NOT NULL, -- Tailwind CSS classes
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default communication types
INSERT INTO communication_types (name, label, icon, color, description) VALUES
('text', '📱 Text Message', '📱', 'bg-blue-100 text-blue-800', 'SMS text messages between parties'),
('email', '📧 Email', '📧', 'bg-green-100 text-green-800', 'Email communications'),
('phone', '📞 Phone Call', '📞', 'bg-purple-100 text-purple-800', 'Voice phone conversations'),
('in_person', '👥 In Person', '👥', 'bg-orange-100 text-orange-800', 'Face-to-face conversations'),
('lawyer', '⚖️ Lawyer Communication', '⚖️', 'bg-gray-100 text-gray-800', 'Communications with legal representatives'),
('school', '🏫 School Communication', '🏫', 'bg-yellow-100 text-yellow-800', 'Communications with school staff'),
('medical', '🏥 Medical Communication', '🏥', 'bg-red-100 text-red-800', 'Communications with healthcare providers'),
('court', '🏛️ Court Communication', '🏛️', 'bg-indigo-100 text-indigo-800', 'Official court communications')
ON CONFLICT (name) DO NOTHING;

-- Priority levels
CREATE TABLE IF NOT EXISTS communication_priorities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE,
  label VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  weight INTEGER NOT NULL, -- for sorting priority
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert priority levels
INSERT INTO communication_priorities (name, label, color, weight) VALUES
('routine', 'Routine', 'bg-gray-100 text-gray-800', 1),
('important', 'Important', 'bg-yellow-100 text-yellow-800', 2),
('emergency', 'Emergency', 'bg-red-100 text-red-800', 3)
ON CONFLICT (name) DO NOTHING;

-- Main communication entries table
CREATE TABLE IF NOT EXISTS communication_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  entry_date DATE NOT NULL,
  entry_time TIME,
  communication_type VARCHAR(50) NOT NULL REFERENCES communication_types(name),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  
  -- Content
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- Participants (JSON array for flexibility)
  participants JSONB NOT NULL DEFAULT '[]', -- ["John Smith", "Jane Doe"]
  
  -- Priority and Response Management
  priority VARCHAR(20) NOT NULL REFERENCES communication_priorities(name) DEFAULT 'routine',
  response_needed BOOLEAN DEFAULT FALSE,
  response_by_date DATE,
  response_received BOOLEAN DEFAULT FALSE,
  response_date DATE,
  
  -- Organization and Linking
  tags JSONB DEFAULT '[]', -- ["urgent", "custody", "pickup"]
  linked_parenting_entry UUID REFERENCES parenting_time_entries(id),
  linked_evidence UUID REFERENCES evidence_items(id),
  
  -- Attachments and Files
  attachments JSONB DEFAULT '[]', -- [{"name": "file.pdf", "url": "/path", "type": "pdf"}]
  
  -- Metadata
  location VARCHAR(255), -- where communication took place (for in-person)
  duration_minutes INTEGER, -- for phone calls
  initiated_by VARCHAR(100), -- who started the communication
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_communication_entries_user_id ON communication_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_entries_date ON communication_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_communication_entries_type ON communication_entries(communication_type);
CREATE INDEX IF NOT EXISTS idx_communication_entries_direction ON communication_entries(direction);
CREATE INDEX IF NOT EXISTS idx_communication_entries_priority ON communication_entries(priority);
CREATE INDEX IF NOT EXISTS idx_communication_entries_response_needed ON communication_entries(response_needed);
CREATE INDEX IF NOT EXISTS idx_communication_entries_tags ON communication_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_communication_entries_participants ON communication_entries USING GIN(participants);

-- Row Level Security
ALTER TABLE communication_entries ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own communications
CREATE POLICY "Users can view own communication entries" ON communication_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own communication entries" ON communication_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own communication entries" ON communication_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own communication entries" ON communication_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Communication timeline for audit trail
CREATE TABLE IF NOT EXISTS communication_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_id UUID REFERENCES communication_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'responded', 'archived'
  changes JSONB, -- what specifically changed
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timeline indexes
CREATE INDEX IF NOT EXISTS idx_communication_timeline_communication_id ON communication_timeline(communication_id);
CREATE INDEX IF NOT EXISTS idx_communication_timeline_user_id ON communication_timeline(user_id);

-- Timeline RLS
ALTER TABLE communication_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timeline for their own communications" ON communication_timeline
  FOR SELECT USING (
    communication_id IN (
      SELECT id FROM communication_entries WHERE user_id = auth.uid()
    )
  );

-- Helper view for displaying communications with type information
CREATE OR REPLACE VIEW communication_view AS
SELECT 
  ce.*,
  ct.label as type_label,
  ct.icon as type_icon,
  ct.color as type_color,
  cp.label as priority_label,
  cp.color as priority_color,
  cp.weight as priority_weight
FROM communication_entries ce
JOIN communication_types ct ON ce.communication_type = ct.name
JOIN communication_priorities cp ON ce.priority = cp.name
ORDER BY ce.entry_date DESC, ce.entry_time DESC;

-- Statistics view for dashboard
CREATE OR REPLACE VIEW communication_stats_view AS
SELECT 
  user_id,
  COUNT(*) as total_communications,
  COUNT(CASE WHEN response_needed = true AND response_received = false THEN 1 END) as pending_responses,
  COUNT(CASE WHEN DATE_TRUNC('month', entry_date) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_count,
  
  -- Average response time calculation (in days)
  ROUND(
    AVG(
      CASE 
        WHEN response_received = true AND response_date IS NOT NULL AND response_by_date IS NOT NULL
        THEN (response_date - response_by_date)::NUMERIC
        ELSE NULL 
      END
    ), 1
  ) as average_response_time_days,
  
  -- Communication type breakdown
  JSONB_OBJECT_AGG(
    communication_type, 
    (SELECT COUNT(*) FROM communication_entries ce2 WHERE ce2.user_id = ce.user_id AND ce2.communication_type = ce.communication_type)
  ) as communication_types_count,
  
  -- Priority breakdown
  COUNT(CASE WHEN priority = 'routine' THEN 1 END) as routine_count,
  COUNT(CASE WHEN priority = 'important' THEN 1 END) as important_count,
  COUNT(CASE WHEN priority = 'emergency' THEN 1 END) as emergency_count,
  
  -- Direction breakdown
  COUNT(CASE WHEN direction = 'incoming' THEN 1 END) as incoming_count,
  COUNT(CASE WHEN direction = 'outgoing' THEN 1 END) as outgoing_count,
  
  -- Recent activity
  MAX(entry_date) as last_communication_date,
  MIN(entry_date) as first_communication_date
FROM communication_entries ce
GROUP BY user_id;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_communication_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_communication_updated_at
  BEFORE UPDATE ON communication_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_communication_updated_at();

-- Function to log communication changes
CREATE OR REPLACE FUNCTION log_communication_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO communication_timeline (communication_id, user_id, action, changes)
    VALUES (NEW.id, NEW.user_id, 'created', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO communication_timeline (communication_id, user_id, action, changes)
    VALUES (NEW.id, NEW.user_id, 'updated', 
            jsonb_build_object(
              'old', to_jsonb(OLD),
              'new', to_jsonb(NEW)
            ));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO communication_timeline (communication_id, user_id, action, changes)
    VALUES (OLD.id, OLD.user_id, 'deleted', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically log communication changes
CREATE TRIGGER log_communication_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON communication_entries
  FOR EACH ROW
  EXECUTE FUNCTION log_communication_changes();

-- Communication search function (for full-text search)
CREATE OR REPLACE FUNCTION search_communications(
  p_user_id UUID,
  p_search_term TEXT DEFAULT '',
  p_communication_type TEXT DEFAULT 'all',
  p_direction TEXT DEFAULT 'all',
  p_priority TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  entry_date DATE,
  entry_time TIME,
  subject VARCHAR(255),
  content TEXT,
  communication_type VARCHAR(50),
  direction VARCHAR(10),
  priority VARCHAR(20),
  participants JSONB,
  type_label VARCHAR(100),
  type_icon VARCHAR(10),
  type_color VARCHAR(50),
  priority_label VARCHAR(50),
  priority_color VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cv.id,
    cv.entry_date,
    cv.entry_time,
    cv.subject,
    cv.content,
    cv.communication_type,
    cv.direction,
    cv.priority,
    cv.participants,
    cv.type_label,
    cv.type_icon,
    cv.type_color,
    cv.priority_label,
    cv.priority_color
  FROM communication_view cv
  WHERE cv.user_id = p_user_id
    AND (p_search_term = '' OR 
         cv.subject ILIKE '%' || p_search_term || '%' OR 
         cv.content ILIKE '%' || p_search_term || '%')
    AND (p_communication_type = 'all' OR cv.communication_type = p_communication_type)
    AND (p_direction = 'all' OR cv.direction = p_direction)
    AND (p_priority = 'all' OR cv.priority = p_priority)
  ORDER BY cv.entry_date DESC, cv.entry_time DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the search function
GRANT EXECUTE ON FUNCTION search_communications TO authenticated;

-- Comments for documentation
COMMENT ON TABLE communication_entries IS 'Comprehensive tracking of all custody-related communications';
COMMENT ON TABLE communication_timeline IS 'Audit trail for all communication entry changes';
COMMENT ON VIEW communication_view IS 'Enhanced view with type and priority information for easy querying';
COMMENT ON VIEW communication_stats_view IS 'Aggregated statistics for communication dashboard';
COMMENT ON FUNCTION search_communications IS 'Full-text search with filtering for communications';

-- Table to track communication relationships (optional for future use)
CREATE TABLE IF NOT EXISTS communication_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_communication_id UUID REFERENCES communication_entries(id) ON DELETE CASCADE,
  child_communication_id UUID REFERENCES communication_entries(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- 'reply', 'follow_up', 'related'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_communication_id, child_communication_id)
);

-- RLS for relationships
ALTER TABLE communication_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage communication relationships for their own entries" ON communication_relationships
  USING (
    parent_communication_id IN (SELECT id FROM communication_entries WHERE user_id = auth.uid()) AND
    child_communication_id IN (SELECT id FROM communication_entries WHERE user_id = auth.uid())
  ); 