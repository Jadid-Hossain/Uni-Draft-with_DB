-- Fix the events table status enum to include the correct values
-- This script will align the event status values across the entire system

-- First, let's check what the current enum values are
SELECT unnest(enum_range(NULL::event_status)) as current_status_values;

-- Drop the existing enum type and recreate it with the correct values
-- We'll use a comprehensive set that covers all use cases
DROP TYPE IF EXISTS event_status CASCADE;

-- Create the new enum type with comprehensive status values
CREATE TYPE event_status AS ENUM (
    'draft',           -- Event is being planned/created
    'upcoming',        -- Event is scheduled and visible
    'ongoing',         -- Event is currently happening
    'completed',       -- Event has finished successfully
    'cancelled',       -- Event was cancelled
    'published'        -- Event is published and visible (alternative to upcoming)
);

-- Add the status column back to the events table if it doesn't exist
-- (This will be done automatically when we recreate the enum)

-- If you need to add the column manually, uncomment the following:
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS status event_status DEFAULT 'upcoming';

-- Update any existing events with invalid status values to use valid ones
-- Map old values to new ones
UPDATE events 
SET status = CASE 
    WHEN status = 'scheduled' THEN 'upcoming'
    WHEN status = 'published' THEN 'upcoming'
    WHEN status IS NULL THEN 'upcoming'
    ELSE 'upcoming'
END
WHERE status IS NULL OR status NOT IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled', 'published');

-- Set a default value for the status column
ALTER TABLE events ALTER COLUMN status SET DEFAULT 'upcoming';

-- Make sure the status column is NOT NULL
ALTER TABLE events ALTER COLUMN status SET NOT NULL;

-- Add a comment to document the enum values
COMMENT ON TYPE event_status IS 'Event status: draft, upcoming, ongoing, completed, cancelled, published';
COMMENT ON COLUMN events.status IS 'Current status of the event';

-- Verify the fix
SELECT unnest(enum_range(NULL::event_status)) as new_status_values;

-- Show current events and their status
SELECT id, title, status FROM events LIMIT 10;
