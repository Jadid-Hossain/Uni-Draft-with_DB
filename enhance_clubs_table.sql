-- Enhance Clubs Table with All Mandatory Fields
-- This script adds all the required fields for comprehensive club management

-- 1. Check current table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clubs'
ORDER BY ordinal_position;

-- 2. Add missing columns if they don't exist
DO $$
BEGIN
  -- Club Email (already exists as club_mail, but let's ensure it's there)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clubs'
    AND column_name = 'club_mail'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN club_mail TEXT;
  END IF;

  -- Club Address (already exists, but let's ensure it's there)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clubs'
    AND column_name = 'address'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN address TEXT;
  END IF;

  -- Club Details (extended description)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clubs'
    AND column_name = 'club_details'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN club_details TEXT;
  END IF;

  -- Club Panel Members (JSON array of panel members)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clubs'
    AND column_name = 'panel_members'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN panel_members JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Club Previous Events List (JSON array of previous events)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clubs'
    AND column_name = 'previous_events'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN previous_events JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Club Achievements (JSON array of achievements)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clubs'
    AND column_name = 'achievements'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN achievements JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Club Team/Departments (JSON array of departments)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clubs'
    AND column_name = 'departments'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN departments JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Club Website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clubs'
    AND column_name = 'website'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN website TEXT;
  END IF;

  -- Club Social Media Links
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clubs'
    AND column_name = 'social_media'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN social_media JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Club Founded Date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clubs'
    AND column_name = 'founded_date'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN founded_date DATE;
  END IF;

  -- Club Mission Statement
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clubs'
    AND column_name = 'mission_statement'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN mission_statement TEXT;
  END IF;

  -- Club Vision Statement
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clubs'
    AND column_name = 'vision_statement'
  ) THEN
    ALTER TABLE public.clubs ADD COLUMN vision_statement TEXT;
  END IF;

  RAISE NOTICE 'All club fields have been added successfully!';
END $$;

-- 3. Update the create_club_admin function to include new fields
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
  _contact_phone TEXT DEFAULT NULL,
  _club_details TEXT DEFAULT NULL,
  _panel_members JSONB DEFAULT '[]'::jsonb,
  _previous_events JSONB DEFAULT '[]'::jsonb,
  _achievements JSONB DEFAULT '[]'::jsonb,
  _departments JSONB DEFAULT '[]'::jsonb,
  _website TEXT DEFAULT NULL,
  _social_media JSONB DEFAULT '{}'::jsonb,
  _founded_date DATE DEFAULT NULL,
  _mission_statement TEXT DEFAULT NULL,
  _vision_statement TEXT DEFAULT NULL,
  _is_public BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _club_id UUID;
BEGIN
  -- Insert the new club with all fields
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
    club_details,
    panel_members,
    previous_events,
    achievements,
    departments,
    website,
    social_media,
    founded_date,
    mission_statement,
    vision_statement,
    is_public,
    status,
    created_at,
    updated_at
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
    _club_details,
    _panel_members,
    _previous_events,
    _achievements,
    _departments,
    _website,
    _social_media,
    _founded_date,
    _mission_statement,
    _vision_statement,
    _is_public,
    'pending',
    NOW(),
    NOW()
  ) RETURNING id INTO _club_id;

  RETURN _club_id;
END;
$$;

-- 4. Update the update_club_admin function to include new fields
CREATE OR REPLACE FUNCTION update_club_admin(
  _club_id UUID,
  _name TEXT,
  _description TEXT,
  _category TEXT,
  _location TEXT DEFAULT NULL,
  _address TEXT DEFAULT NULL,
  _meeting_day TEXT DEFAULT NULL,
  _meeting_time TEXT DEFAULT NULL,
  _max_members INTEGER DEFAULT NULL,
  _requirements TEXT DEFAULT NULL,
  _contact_email TEXT DEFAULT NULL,
  _club_mail TEXT DEFAULT NULL,
  _contact_phone TEXT DEFAULT NULL,
  _club_details TEXT DEFAULT NULL,
  _panel_members JSONB DEFAULT '[]'::jsonb,
  _previous_events JSONB DEFAULT '[]'::jsonb,
  _achievements JSONB DEFAULT '[]'::jsonb,
  _departments JSONB DEFAULT '[]'::jsonb,
  _website TEXT DEFAULT NULL,
  _social_media JSONB DEFAULT '{}'::jsonb,
  _founded_date DATE DEFAULT NULL,
  _mission_statement TEXT DEFAULT NULL,
  _vision_statement TEXT DEFAULT NULL,
  _is_public BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the club with all fields
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
    club_details = _club_details,
    panel_members = _panel_members,
    previous_events = _previous_events,
    achievements = _achievements,
    departments = _departments,
    website = _website,
    social_media = _social_media,
    founded_date = _founded_date,
    mission_statement = _mission_statement,
    vision_statement = _vision_statement,
    is_public = _is_public,
    updated_at = NOW()
  WHERE id = _club_id;

  RETURN FOUND;
END;
$$;

-- 5. Verify the updated table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clubs'
ORDER BY ordinal_position;

-- 6. Show the updated functions
SELECT 
  routine_name,
  'Function Updated' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('create_club_admin', 'update_club_admin')
ORDER BY routine_name;
