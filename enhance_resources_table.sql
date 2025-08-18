-- Enhance resources table for better functionality
-- Run this in your Supabase SQL editor to add missing columns

-- 1. Add missing columns if they don't exist
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;

ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS file_type TEXT;

ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Academic';

ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS subject TEXT;

ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS course_code TEXT;

ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS tags TEXT[];

ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources(subject);
CREATE INDEX IF NOT EXISTS idx_resources_file_type ON resources(file_type);
CREATE INDEX IF NOT EXISTS idx_resources_download_count ON resources(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);

-- 3. Update existing resources with default values
UPDATE resources 
SET 
  file_size = COALESCE(file_size, 0),
  download_count = COALESCE(download_count, 0),
  category = COALESCE(category, 'Academic'),
  is_approved = COALESCE(is_approved, true)
WHERE 
  file_size IS NULL 
  OR download_count IS NULL 
  OR category IS NULL 
  OR is_approved IS NULL;

-- 4. Add RLS policies for better security
-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Policy for reading resources (public)
CREATE POLICY "Resources are viewable by everyone" ON resources
  FOR SELECT USING (true);

-- Policy for inserting resources (authenticated users)
CREATE POLICY "Users can insert resources" ON resources
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for updating resources (owner only)
CREATE POLICY "Users can update own resources" ON resources
  FOR UPDATE USING (auth.uid() = uploaded_by);

-- Policy for deleting resources (owner only)
CREATE POLICY "Users can delete own resources" ON resources
  FOR DELETE USING (auth.uid() = uploaded_by);

-- 5. Create function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count(resource_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE resources 
  SET download_count = download_count + 1 
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Verify the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'resources'
ORDER BY ordinal_position;

-- 7. Check sample data
SELECT 
  id,
  title,
  file_size,
  file_type,
  download_count,
  category,
  created_at
FROM resources 
LIMIT 5;
