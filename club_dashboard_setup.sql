-- Club Dashboard Database Setup
-- This script ensures all necessary tables and relationships exist for the Club Dashboard

-- 1. Check if events table has club_id column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' 
                   AND column_name = 'club_id' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.events ADD COLUMN club_id UUID;
        RAISE NOTICE 'Added club_id column to events table';
    ELSE
        RAISE NOTICE 'club_id column already exists in events table';
    END IF;
END $$;

-- 2. Check if club_membership_application table exists
CREATE TABLE IF NOT EXISTS public.club_membership_application (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL,
  user_id TEXT NOT NULL, -- Using TEXT to avoid FK constraints
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  application_date TIMESTAMPTZ DEFAULT NOW(),
  motivation TEXT,
  experience TEXT,
  skills TEXT,
  availability TEXT,
  expectations TEXT,
  agreed_to_terms BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_membership_application_club_id ON public.club_membership_application(club_id);
CREATE INDEX IF NOT EXISTS idx_club_membership_application_user_id ON public.club_membership_application(user_id);
CREATE INDEX IF NOT EXISTS idx_club_membership_application_status ON public.club_membership_application(status);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON public.events(club_id);

-- 4. Enable RLS on club_membership_application
ALTER TABLE public.club_membership_application ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for club_membership_application
DROP POLICY IF EXISTS "Club leaders can view applications" ON public.club_membership_application;
CREATE POLICY "Club leaders can view applications" ON public.club_membership_application
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clubs 
      WHERE id = club_membership_application.club_id 
      AND created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Club leaders can update applications" ON public.club_membership_application;
CREATE POLICY "Club leaders can update applications" ON public.club_membership_application
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.clubs 
      WHERE id = club_membership_application.club_id 
      AND created_by = auth.uid()
    )
  );

-- 6. Create function to update timestamps
CREATE OR REPLACE FUNCTION update_club_membership_application_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for timestamp updates
DROP TRIGGER IF EXISTS trigger_update_club_membership_application_updated_at ON public.club_membership_application;
CREATE TRIGGER trigger_update_club_membership_application_updated_at
  BEFORE UPDATE ON public.club_membership_application
  FOR EACH ROW
  EXECUTE FUNCTION update_club_membership_application_updated_at();

-- 8. Update events table RLS to allow club leaders to manage their events
DROP POLICY IF EXISTS "Club leaders can manage events" ON public.events;
CREATE POLICY "Club leaders can manage events" ON public.events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clubs 
      WHERE id = events.club_id 
      AND created_by = auth.uid()
    )
  );

-- 9. Insert sample club membership applications (if you want to test)
-- Uncomment and modify the user_id values below to test the dashboard
/*
INSERT INTO public.club_membership_application (club_id, user_id, status, motivation, experience, skills, availability, expectations, agreed_to_terms)
VALUES 
  (
    (SELECT id FROM public.clubs LIMIT 1),
    'test-user-1',
    'pending',
    'I am passionate about technology and want to learn more',
    'Basic programming knowledge',
    'JavaScript, Python',
    'Weekends and evenings',
    'Learn advanced programming concepts',
    true
  ),
  (
    (SELECT id FROM public.clubs LIMIT 1),
    'test-user-2',
    'approved',
    'Interested in robotics and automation',
    'Electronics background',
    'Arduino, C++',
    'Flexible schedule',
    'Build innovative projects',
    true
  );
*/

-- 10. Verification queries
-- Check table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('club_membership_application', 'events', 'clubs')
ORDER BY table_name, ordinal_position;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('club_membership_application', 'events');

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('club_membership_application', 'events');

-- 11. Sample data for testing (optional)
-- Create a test club if none exist
INSERT INTO public.clubs (name, description, category, is_public, created_by)
SELECT 
  'Test Club',
  'A test club for demonstration purposes',
  'Technology',
  true,
  auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.clubs WHERE created_by = auth.uid())
ON CONFLICT DO NOTHING;

-- 12. Final verification
SELECT 
  'clubs' as table_name,
  COUNT(*) as count
FROM public.clubs

UNION ALL

SELECT 
  'club_membership_application' as table_name,
  COUNT(*) as count
FROM public.club_membership_application

UNION ALL

SELECT 
  'events' as table_name,
  COUNT(*) as count
FROM public.events;
