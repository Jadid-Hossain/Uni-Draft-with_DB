-- Add image upload support to forum tables
-- This script adds image_url columns to support image attachments in forum threads and posts

-- Add image_url column to forum_threads table
ALTER TABLE public.forum_threads ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to forum_posts table  
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN public.forum_threads.image_url IS 'URL for the image attached to the forum thread';
COMMENT ON COLUMN public.forum_posts.image_url IS 'URL for the image attached to the forum post';

-- Create indexes for better performance when filtering by images
CREATE INDEX IF NOT EXISTS idx_forum_threads_has_image ON public.forum_threads(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forum_posts_has_image ON public.forum_posts(image_url) WHERE image_url IS NOT NULL;

-- Verify the changes
SELECT 
  table_name,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('forum_threads', 'forum_posts')
  AND table_schema = 'public'
  AND column_name = 'image_url'
ORDER BY table_name;
