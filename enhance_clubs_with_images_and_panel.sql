-- Enhance Clubs Table with Images and Panel Member Management
-- Run this in your Supabase SQL Editor

-- 1. Add club_image_url column
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS club_image_url TEXT;

-- 2. Add panel_members_json column
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS panel_members_json JSONB DEFAULT '[]'::jsonb;

-- 3. Add panel member function
CREATE OR REPLACE FUNCTION add_club_panel_member(
  _club_id UUID, _role TEXT, _student_id TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _user_id UUID;
  _panel_member JSONB;
  _current_panel JSONB;
BEGIN
  SELECT id INTO _user_id FROM users WHERE student_id = _student_id;
  IF _user_id IS NULL THEN RAISE EXCEPTION 'User with student ID % not found', _student_id; END IF;
  
  SELECT COALESCE(panel_members_json, '[]'::jsonb) INTO _current_panel FROM clubs WHERE id = _club_id;
  
  _panel_member := jsonb_build_object('role', _role, 'student_id', _student_id, 'user_id', _user_id, 'added_at', NOW());
  
  UPDATE clubs SET panel_members_json = _current_panel || _panel_member WHERE id = _club_id;
  RETURN FOUND;
END;
$$;

-- 4. Remove panel member function
CREATE OR REPLACE FUNCTION remove_club_panel_member(
  _club_id UUID, _student_id TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _current_panel JSONB;
  _updated_panel JSONB := '[]'::jsonb;
  _member JSONB;
BEGIN
  SELECT COALESCE(panel_members_json, '[]'::jsonb) INTO _current_panel FROM clubs WHERE id = _club_id;
  
  FOR _member IN SELECT * FROM jsonb_array_elements(_current_panel)
  LOOP
    IF (_member->>'student_id') != _student_id THEN
      _updated_panel := _updated_panel || _member;
    END IF;
  END LOOP;
  
  UPDATE clubs SET panel_members_json = _updated_panel WHERE id = _club_id;
  RETURN FOUND;
END;
$$;

-- 5. Get panel members function
CREATE OR REPLACE FUNCTION get_club_panel_members(_club_id UUID)
RETURNS TABLE(role TEXT, student_id TEXT, user_id UUID, full_name TEXT, email TEXT, department TEXT, avatar_url TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm->>'role' as role,
    pm->>'student_id' as student_id,
    (pm->>'user_id')::UUID as user_id,
    u.full_name, u.email, u.department, u.avatar_url
  FROM clubs c,
       jsonb_array_elements(COALESCE(c.panel_members_json, '[]'::jsonb)) pm,
       users u
  WHERE c.id = _club_id AND u.id = (pm->>'user_id')::UUID;
END;
$$;
