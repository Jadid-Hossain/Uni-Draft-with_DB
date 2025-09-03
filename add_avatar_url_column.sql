-- Add avatar_url column to users table for profile pictures
-- This column will store Cloudinary URLs

-- Add the column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile picture stored in Cloudinary';

-- Update existing rows to have NULL for avatar_url (optional)
-- UPDATE users SET avatar_url = NULL WHERE avatar_url IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'avatar_url';
