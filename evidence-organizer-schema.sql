-- Evidence Organizer Database Schema for MyCustodyCoach
-- This schema supports comprehensive evidence management for custody cases

-- Evidence Categories (predefined types)
CREATE TABLE IF NOT EXISTS evidence_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- emoji or icon name for UI
    color VARCHAR(20), -- hex color for UI theming
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default evidence categories
INSERT INTO evidence_categories (name, description, icon, color, sort_order) VALUES
('Communication', 'Text messages, emails, voicemails from other parent', '💬', '#3B82F6', 1),
('Documents', 'Court orders, legal papers, medical records, school records', '📄', '#10B981', 2),
('Incidents', 'Documentation of concerning behaviors or violations', '⚠️', '#EF4444', 3),
('Photos/Videos', 'Visual evidence, property damage, conditions', '📸', '#8B5CF6', 4),
('Financial', 'Child support records, expense receipts, financial documents', '💰', '#F59E0B', 5),
('Medical', 'Medical records, insurance, health-related communications', '🏥', '#EC4899', 6),
('School', 'Report cards, teacher communications, attendance records', '🎓', '#06B6D4', 7),
('Other', 'Miscellaneous evidence that doesn''t fit other categories', '📁', '#6B7280', 8)
ON CONFLICT (name) DO NOTHING;

-- Main Evidence Items Table
CREATE TABLE IF NOT EXISTS evidence_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES evidence_categories(id) NOT NULL,
    
    -- Basic Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Date/Time Information
    incident_date DATE, -- when the incident/communication occurred
    time_of_day TIME, -- specific time if relevant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Content
    content_text TEXT, -- transcribed text, notes, etc.
    file_url TEXT, -- will store file path when file upload is enabled
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size INTEGER,
    
    -- Metadata for organization
    tags TEXT[], -- array of custom tags
    people_involved TEXT[], -- array of people names
    location VARCHAR(255), -- where incident occurred
    
    -- Legal relevance
    importance_level INTEGER CHECK (importance_level IN (1,2,3,4,5)) DEFAULT 3, -- 1=low, 5=critical
    is_court_admissible BOOLEAN DEFAULT false,
    
    -- Organization
    case_number VARCHAR(100), -- if related to specific case
    opposing_party VARCHAR(255), -- other parent's name
    
    -- Privacy and access
    is_archived BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false -- soft delete
);

-- Evidence Collections (for grouping related evidence)
CREATE TABLE IF NOT EXISTS evidence_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT false
);

-- Many-to-many relationship between evidence items and collections
CREATE TABLE IF NOT EXISTS evidence_collection_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES evidence_collections(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES evidence_items(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, evidence_id)
);

-- Evidence timeline events (for tracking changes)
CREATE TABLE IF NOT EXISTS evidence_timeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evidence_id UUID REFERENCES evidence_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'archived', 'restored'
    changes JSONB, -- what specifically changed
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_items_user_id ON evidence_items(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_category_id ON evidence_items(category_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_incident_date ON evidence_items(incident_date);
CREATE INDEX IF NOT EXISTS idx_evidence_items_importance ON evidence_items(importance_level);
CREATE INDEX IF NOT EXISTS idx_evidence_items_tags ON evidence_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_evidence_items_people ON evidence_items USING GIN(people_involved);
CREATE INDEX IF NOT EXISTS idx_evidence_items_archived ON evidence_items(is_archived);
CREATE INDEX IF NOT EXISTS idx_evidence_collections_user_id ON evidence_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_timeline_evidence_id ON evidence_timeline(evidence_id);

-- Enable Row Level Security
ALTER TABLE evidence_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_timeline ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Evidence categories are public (read-only for all authenticated users)
CREATE POLICY "Evidence categories are viewable by authenticated users" 
    ON evidence_categories FOR SELECT 
    TO authenticated 
    USING (true);

-- Evidence items - users can only access their own
CREATE POLICY "Users can view their own evidence items" 
    ON evidence_items FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Users can insert their own evidence items" 
    ON evidence_items FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evidence items" 
    ON evidence_items FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evidence items" 
    ON evidence_items FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- Evidence collections - users can only access their own
CREATE POLICY "Users can view their own evidence collections" 
    ON evidence_collections FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evidence collections" 
    ON evidence_collections FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evidence collections" 
    ON evidence_collections FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evidence collections" 
    ON evidence_collections FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- Collection items - users can only manage items in their own collections
CREATE POLICY "Users can manage their own collection items" 
    ON evidence_collection_items FOR ALL 
    TO authenticated 
    USING (
        collection_id IN (
            SELECT id FROM evidence_collections WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        collection_id IN (
            SELECT id FROM evidence_collections WHERE user_id = auth.uid()
        )
    );

-- Timeline - users can view timeline for their own evidence
CREATE POLICY "Users can view timeline for their own evidence" 
    ON evidence_timeline FOR SELECT 
    TO authenticated 
    USING (
        evidence_id IN (
            SELECT id FROM evidence_items WHERE user_id = auth.uid()
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_evidence_items_updated_at
    BEFORE UPDATE ON evidence_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_evidence_collections_updated_at
    BEFORE UPDATE ON evidence_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Function to log changes to evidence timeline
CREATE OR REPLACE FUNCTION log_evidence_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO evidence_timeline (evidence_id, user_id, action, changes)
        VALUES (NEW.id, NEW.user_id, 'created', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO evidence_timeline (evidence_id, user_id, action, changes)
        VALUES (NEW.id, NEW.user_id, 'updated', 
                jsonb_build_object(
                    'old', to_jsonb(OLD),
                    'new', to_jsonb(NEW)
                ));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO evidence_timeline (evidence_id, user_id, action, changes)
        VALUES (OLD.id, OLD.user_id, 'deleted', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically log evidence changes
CREATE TRIGGER log_evidence_item_changes
    AFTER INSERT OR UPDATE OR DELETE ON evidence_items
    FOR EACH ROW
    EXECUTE FUNCTION log_evidence_changes();

-- Views for easier querying

-- Evidence with category information
CREATE OR REPLACE VIEW evidence_with_category AS
SELECT 
    e.*,
    c.name as category_name,
    c.icon as category_icon,
    c.color as category_color
FROM evidence_items e
JOIN evidence_categories c ON e.category_id = c.id
WHERE e.is_deleted = false;

-- Evidence statistics per user
CREATE OR REPLACE VIEW user_evidence_stats AS
SELECT 
    user_id,
    COUNT(*) as total_items,
    COUNT(CASE WHEN is_court_admissible THEN 1 END) as court_admissible_items,
    COUNT(CASE WHEN importance_level >= 4 THEN 1 END) as high_importance_items,
    MAX(incident_date) as latest_incident,
    MIN(incident_date) as earliest_incident
FROM evidence_items 
WHERE is_deleted = false 
GROUP BY user_id; 