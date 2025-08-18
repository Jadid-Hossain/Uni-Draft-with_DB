-- Fix notifications column and corrupted data in users table
-- Run this in your Supabase SQL editor to fix the notifications system

-- 1. Add notifications column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '[]'::jsonb;

-- 2. Fix corrupted notifications data by resetting to empty array
UPDATE users 
SET notifications = '[]'::jsonb 
WHERE notifications IS NULL 
   OR notifications = '' 
   OR notifications::text LIKE '%[%[%'  -- Detects corrupted nested arrays
   OR notifications::text LIKE '%"%"%'  -- Detects corrupted quotes
   OR notifications::text LIKE '%1755545456743%'  -- Detects the corrupted data pattern
   OR jsonb_typeof(notifications) != 'array'  -- Ensures it's a valid JSON array
   OR jsonb_array_length(notifications) > 100;  -- Detects extremely long corrupted arrays

-- 3. Insert sample notifications for testing (optional)
UPDATE users 
SET notifications = '[
  {
    "id": "1755545456743",
    "title": "Student Management Notification",
    "message": "Holiday Announcement",
    "type": "info",
    "timestamp": "2025-08-18T19:30:56.743Z",
    "read": false
  },
  {
    "id": "1755545451520",
    "title": "Student Management Notification",
    "message": "Join New Club - Registration Open",
    "type": "info",
    "timestamp": "2025-08-18T18:51:45.424Z",
    "read": false
  }
]'::jsonb
WHERE id = '6e283322-4819-4c02-aabb-caa8a65a5461'  -- Replace with actual user ID
AND notifications = '[]'::jsonb;

-- 4. Verify the notifications column structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'notifications';

-- 5. Check sample notifications data
SELECT 
  id,
  email,
  jsonb_array_length(notifications) as notification_count,
  notifications
FROM users 
WHERE notifications != '[]'::jsonb
LIMIT 5;
