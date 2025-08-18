-- Add profile fields to users table
-- Run this in your Supabase SQL editor to add the missing columns

-- Add bio column (text field for user's bio/about me)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add interests column (text field for comma-separated interests)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS interests TEXT;

-- Add achievements column (text field for line-separated achievements)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS achievements TEXT;

-- Update existing users to have empty values for new columns
UPDATE users 
SET 
  bio = COALESCE(bio, ''),
  interests = COALESCE(interests, ''),
  achievements = COALESCE(achievements, '')
WHERE bio IS NULL OR interests IS NULL OR achievements IS NULL;

-- Verify the columns were added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('bio', 'interests', 'achievements')
ORDER BY column_name;
