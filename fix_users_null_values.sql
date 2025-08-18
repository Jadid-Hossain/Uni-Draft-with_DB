-- Fix null/undefined values in users table
-- This script ensures all users have proper role and status values

-- Update users with null/missing status to 'approved' (existing users should be approved)
UPDATE users 
SET status = 'approved' 
WHERE status IS NULL OR status = '';

-- Update users with null/missing role to 'student' (default role)
UPDATE users 
SET role = 'student' 
WHERE role IS NULL OR role = '';

-- Ensure all users have a full_name (use email if full_name is null)
UPDATE users 
SET full_name = email 
WHERE full_name IS NULL OR full_name = '';

-- Add constraints to prevent null values in the future
ALTER TABLE users 
ALTER COLUMN status SET DEFAULT 'pending',
ALTER COLUMN role SET DEFAULT 'student';

-- Add NOT NULL constraints if they don't exist
-- (Comment out if columns already have NOT NULL constraints)
-- ALTER TABLE users 
-- ALTER COLUMN status SET NOT NULL,
-- ALTER COLUMN role SET NOT NULL;

-- Verify the updates
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as null_role,
    COUNT(CASE WHEN full_name IS NULL THEN 1 END) as null_full_name
FROM users;

-- Show distribution of roles and statuses
SELECT 
    role, 
    COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY count DESC;

SELECT 
    status, 
    COUNT(*) as count 
FROM users 
GROUP BY status 
ORDER BY count DESC;
