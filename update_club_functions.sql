-- Update Club Management Functions to Include Address and Club Mail
-- This script updates the existing functions to handle the new fields

-- 1. Update create_club_admin function
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
  -- Insert the new club
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
    'pending',
    NOW(),
    NOW()
  ) RETURNING id INTO _club_id;

  RETURN _club_id;
END;
$$;

-- 2. Update update_club_admin function
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
  _contact_phone TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the club
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

  RETURN FOUND;
END;
$$;

-- 3. Update get_all_clubs_admin function
CREATE OR REPLACE FUNCTION get_all_clubs_admin()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  location TEXT,
  address TEXT,
  meeting_day TEXT,
  meeting_time TEXT,
  max_members INTEGER,
  requirements TEXT,
  contact_email TEXT,
  club_mail TEXT,
  contact_phone TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  members_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.category,
    c.location,
    c.address,
    c.meeting_day,
    c.meeting_time,
    c.max_members,
    c.requirements,
    c.contact_email,
    c.club_mail,
    c.contact_phone,
    c.status,
    c.created_at,
    c.updated_at,
    c.created_by,
    c.approved_by,
    c.approved_at,
    COUNT(cm.id)::BIGINT as members_count
  FROM public.clubs c
  LEFT JOIN public.club_memberships cm ON c.id = cm.club_id AND cm.status = 'active'
  GROUP BY c.id
  ORDER BY c.created_at DESC;
END;
$$;

-- 4. Update get_active_clubs function
CREATE OR REPLACE FUNCTION get_active_clubs()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  location TEXT,
  address TEXT,
  meeting_day TEXT,
  meeting_time TEXT,
  max_members INTEGER,
  requirements TEXT,
  contact_email TEXT,
  club_mail TEXT,
  contact_phone TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  members_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.category,
    c.location,
    c.address,
    c.meeting_day,
    c.meeting_time,
    c.max_members,
    c.requirements,
    c.contact_email,
    c.club_mail,
    c.contact_phone,
    c.status,
    c.created_at,
    c.updated_at,
    c.created_by,
    c.approved_by,
    c.approved_at,
    COUNT(cm.id)::BIGINT as members_count
  FROM public.clubs c
  LEFT JOIN public.club_memberships cm ON c.id = cm.club_id AND cm.status = 'active'
  WHERE c.status = 'active'
  GROUP BY c.id
  ORDER BY c.created_at DESC;
END;
$$;

-- 5. Verify the functions were created
SELECT 'Club Management Functions Updated Successfully!' as status;

-- Show the updated functions
SELECT 
  routine_name,
  'Function' as object_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_club_admin', 'update_club_admin', 'get_all_clubs_admin', 'get_active_clubs')
ORDER BY routine_name;
