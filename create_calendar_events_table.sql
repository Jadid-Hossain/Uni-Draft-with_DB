-- Create calendar_events table for centralized university calendar
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    type VARCHAR(50) NOT NULL DEFAULT 'event' CHECK (type IN ('event', 'deadline', 'meeting', 'exam', 'holiday')),
    category VARCHAR(100) DEFAULT 'General',
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_priority ON calendar_events(priority);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_club_id ON calendar_events(club_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range ON calendar_events(start_date, end_date);

-- Add comments to document the table
COMMENT ON TABLE calendar_events IS 'Centralized university calendar for all activities, deadlines, and important dates';
COMMENT ON COLUMN calendar_events.type IS 'Type of calendar event: event, deadline, meeting, exam, or holiday';
COMMENT ON COLUMN calendar_events.priority IS 'Priority level: low, medium, or high';
COMMENT ON COLUMN calendar_events.category IS 'Category of the event (e.g., Academic, Social, Administrative)';
COMMENT ON COLUMN calendar_events.club_id IS 'Associated club if the event is club-specific';
COMMENT ON COLUMN calendar_events.is_all_day IS 'Whether the event spans the entire day';

-- Insert some sample data for testing
INSERT INTO calendar_events (title, description, start_date, end_date, start_time, end_time, type, category, priority, created_by) VALUES
('Semester Start', 'Fall semester begins for all students', '2024-09-01', '2024-09-01', '08:00:00', '17:00:00', 'event', 'Academic', 'high', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('Midterm Exams', 'Midterm examination period', '2024-10-15', '2024-10-20', '09:00:00', '17:00:00', 'exam', 'Academic', 'high', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('Thanksgiving Break', 'University closed for Thanksgiving holiday', '2024-11-28', '2024-11-30', NULL, NULL, 'holiday', 'Holiday', 'medium', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('Final Exams', 'Final examination period', '2024-12-16', '2024-12-20', '09:00:00', '17:00:00', 'exam', 'Academic', 'high', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('Project Deadline', 'Final project submission deadline', '2024-12-15', '2024-12-15', '23:59:00', '23:59:00', 'deadline', 'Academic', 'high', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('Student Orientation', 'New student orientation program', '2024-08-25', '2024-08-27', '09:00:00', '16:00:00', 'event', 'Student Life', 'medium', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('Career Fair', 'Annual university career fair', '2024-10-10', '2024-10-10', '10:00:00', '18:00:00', 'event', 'Career Services', 'medium', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('Homecoming Week', 'University homecoming celebrations', '2024-11-04', '2024-11-10', '09:00:00', '22:00:00', 'event', 'Student Life', 'medium', (SELECT id FROM users WHERE role = 'admin' LIMIT 1));

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER trigger_update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_events_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view all calendar events
CREATE POLICY "Users can view all calendar events" ON calendar_events
    FOR SELECT USING (true);

-- Users can create events
CREATE POLICY "Users can create calendar events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own events
CREATE POLICY "Users can update their own calendar events" ON calendar_events
    FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own events
CREATE POLICY "Users can delete their own calendar events" ON calendar_events
    FOR DELETE USING (auth.uid() = created_by);

-- Admins can manage all events
CREATE POLICY "Admins can manage all calendar events" ON calendar_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Club admins can manage events for their clubs
CREATE POLICY "Club admins can manage club events" ON calendar_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.club_admin = calendar_events.club_id)
        )
    );
