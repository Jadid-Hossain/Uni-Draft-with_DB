-- Add club_logo_url column to clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS club_logo_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN clubs.club_logo_url IS 'URL for the club logo image (typically smaller, square format)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clubs' AND column_name = 'club_logo_url';
