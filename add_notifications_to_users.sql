-- Add notifications column to users table for student management notifications
-- This column will store an array of notification objects as JSON

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '[]'::jsonb;

-- Add a comment to explain the column structure
COMMENT ON COLUMN users.notifications IS 'Array of notification objects with structure: {id, title, message, type, timestamp, read}';

-- Optional: Create an index on notifications for better query performance
CREATE INDEX IF NOT EXISTS idx_users_notifications ON users USING GIN (notifications);

-- Example of notification structure:
-- [
--   {
--     "id": "1704067200000",
--     "title": "Student Management Notification",
--     "message": "New Event",
--     "type": "info",
--     "timestamp": "2024-01-01T00:00:00.000Z",
--     "read": false
--   }
-- ]
