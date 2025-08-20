-- Create notifications table for event notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    related_id UUID, -- Can reference event ID, club ID, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Add comment to document the table
COMMENT ON TABLE notifications IS 'Stores user notifications for events, club activities, and system messages';
COMMENT ON COLUMN notifications.user_id IS 'ID of the user who should receive the notification (references users.id via applicant_id from club_membership_application)';
COMMENT ON COLUMN notifications.type IS 'Type of notification (event_created, club_update, system, etc.)';
COMMENT ON COLUMN notifications.related_id IS 'ID of the related entity (event, club, etc.)';
COMMENT ON COLUMN notifications.is_read IS 'Whether the user has read the notification';

-- Note: The user_id in notifications table corresponds to applicant_id from club_membership_application table
-- which is the actual user ID that can be used to find all user info from the users table
