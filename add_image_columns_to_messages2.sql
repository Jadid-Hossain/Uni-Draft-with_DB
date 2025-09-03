-- Add image support columns to messages2 table
-- Run this in your Supabase SQL Editor to fix the image sending error

-- Add image_url column for storing Cloudinary image URLs
ALTER TABLE messages2
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add message_type column for categorizing message types
ALTER TABLE messages2
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'text_with_image'));

-- Add comments to document the new columns
COMMENT ON COLUMN messages2.image_url IS 'URL to image stored in Cloudinary for image messages';
COMMENT ON COLUMN messages2.message_type IS 'Type of message: text, image, or text_with_image';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'messages2' 
AND column_name IN ('image_url', 'message_type')
ORDER BY column_name;
