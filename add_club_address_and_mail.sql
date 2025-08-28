-- Add new columns to clubs table for address and club_mail
-- This script adds the missing fields that are displayed in the ClubDetails page

-- Add address column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clubs' 
                   AND column_name = 'address' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.clubs ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column to clubs table';
    ELSE
        RAISE NOTICE 'address column already exists in clubs table';
    END IF;
END $$;

-- Add club_mail column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clubs' 
                   AND column_name = 'club_mail' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.clubs ADD COLUMN club_mail TEXT;
        RAISE NOTICE 'Added club_mail column to clubs table';
    ELSE
        RAISE NOTICE 'club_mail column already exists in clubs table';
    END IF;
END $$;

-- Update the create_club_admin function to include the new fields
CREATE OR REPLACE FUNCTION create_club_admin(
  _name TEXT,
  _description TEXT,
  _category TEXT,
  _created_by UUID,
  _location TEXT DEFAULT NULL,
  _address TEXT DEFAULT NULL,
  _meeting_day TEXT DEFAULT NULL,
  _meeting_time TEXT DEFAULT NULL,
  _max_members INTEGER DEFAULT NULL,
  _requirements TEXT DEFAULT NULL,
  _contact_email TEXT DEFAULT NULL,
  _club_mail TEXT DEFAULT NULL,
  _contact_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _club_id UUID;
BEGIN
  -- Insert new club
  INSERT INTO public.clubs (
    name, 
    description, 
    category, 
    created_by,
    location,
    address,
    meeting_day,
    meeting_time,
    max_members,
    requirements,
    contact_email,
    club_mail,
    contact_phone,
    status
  ) VALUES (
    _name, 
    _description, 
    _category, 
    _created_by,
    _location,
    _address,
    _meeting_day,
    _meeting_time,
    _max_members,
    _requirements,
    _contact_email,
    _club_mail,
    _contact_phone,
    'pending'
  ) RETURNING id INTO _club_id;

  RETURN _club_id;
END;
$$;

-- Update the update_club_admin function to include the new fields
CREATE OR REPLACE FUNCTION update_club_admin(
  _club_id UUID,
  _name TEXT,
  _description TEXT,
  _category TEXT,
  _user_id UUID,
  _location TEXT DEFAULT NULL,
  _address TEXT DEFAULT NULL,
  _meeting_day TEXT DEFAULT NULL,
  _meeting_time TEXT DEFAULT NULL,
  _max_members INTEGER DEFAULT NULL,
  _requirements TEXT DEFAULT NULL,
  _contact_email TEXT DEFAULT NULL,
  _club_mail TEXT DEFAULT NULL,
  _contact_phone TEXT DEFAULT NULL,
  _status TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update club
  UPDATE public.clubs SET
    name = _name,
    description = _description,
    category = _category,
    location = _location,
    address = _address,
    meeting_day = _meeting_day,
    meeting_time = _meeting_time,
    max_members = _max_members,
    requirements = _requirements,
    contact_email = _contact_email,
    club_mail = _club_mail,
    contact_phone = _contact_phone,
    updated_at = NOW()
  WHERE id = _club_id;

  -- Update status if provided
  IF _status IS NOT NULL THEN
    UPDATE public.clubs SET
      status = _status::text,
      updated_at = NOW()
    WHERE id = _club_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clubs'
  AND column_name IN ('address', 'club_mail')
ORDER BY column_name;

-- Show the updated table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clubs'
ORDER BY ordinal_position;
