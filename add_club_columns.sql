-- Add Missing Columns to Clubs Table
-- This script adds the address and club_mail columns if they don't exist

-- 1. Add address column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clubs' 
    AND column_name = 'address'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN address TEXT;
  END IF;
END $$;

-- 2. Add club_mail column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clubs' 
    AND column_name = 'club_mail'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN club_mail TEXT;
  END IF;
END $$;

-- 3. Verify the columns were added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clubs' 
  AND column_name IN ('address', 'club_mail')
ORDER BY column_name;

-- 4. Show the complete table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clubs'
ORDER BY ordinal_position;
