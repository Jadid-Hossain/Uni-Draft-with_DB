-- Add club_admin column to users table
-- This column stores the club ID if the user is assigned as a club admin

-- Add the club_admin column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS club_admin UUID REFERENCES clubs(id) ON DELETE SET NULL;

-- Add an index for better performance when querying by club_admin
CREATE INDEX IF NOT EXISTS idx_users_club_admin ON users(club_admin);

-- Add a comment to document the column
COMMENT ON COLUMN users.club_admin IS 'Club ID if user is assigned as club admin, NULL otherwise';

-- Update RLS policies to allow users to read their own club_admin field
-- (This assumes you have RLS enabled on the users table)
-- You may need to adjust your existing RLS policies accordingly

-- Example RLS policy (uncomment if needed):
-- CREATE POLICY "Users can read their own club_admin" ON users
--   FOR SELECT USING (auth.uid() = id);

-- Example RLS policy for club admins to read their club info (uncomment if needed):
-- CREATE POLICY "Club admins can read their club info" ON clubs
--   FOR SELECT USING (auth.uid() IN (
--     SELECT id FROM users WHERE club_admin = clubs.id
--   ));
