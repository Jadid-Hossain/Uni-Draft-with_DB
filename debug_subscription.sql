-- Debug Club Subscriptions
-- This script helps debug subscription issues

-- 1. Check if the club_subscriptions table exists
SELECT 
  table_name,
  'Table exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'club_subscriptions';

-- 2. If table doesn't exist, create it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'club_subscriptions'
  ) THEN
    CREATE TABLE public.club_subscriptions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      subscribed_at TIMESTAMPTZ DEFAULT NOW(),
      notification_preferences JSONB DEFAULT '{"events": true, "announcements": true, "activities": true}'::jsonb,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(club_id, user_id)
    );
    
    RAISE NOTICE 'club_subscriptions table created successfully';
  ELSE
    RAISE NOTICE 'club_subscriptions table already exists';
  END IF;
END $$;

-- 3. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'club_subscriptions'
ORDER BY ordinal_position;

-- 4. Check if there are any existing subscriptions
SELECT 
  COUNT(*) as total_subscriptions,
  'Current subscriptions' as status
FROM public.club_subscriptions;

-- 5. Show sample data if any exists
SELECT 
  cs.id,
  cs.club_id,
  cs.user_id,
  cs.subscribed_at,
  cs.is_active,
  c.name as club_name,
  u.full_name as user_name
FROM public.club_subscriptions cs
LEFT JOIN public.clubs c ON cs.club_id = c.id
LEFT JOIN public.users u ON cs.user_id = u.id
LIMIT 10;

-- 6. Check if there are any clubs and users to test with
SELECT 
  COUNT(*) as total_clubs,
  'Available clubs' as status
FROM public.clubs;

SELECT 
  COUNT(*) as total_users,
  'Available users' as status
FROM public.users;

-- 7. Test subscription insertion (replace with actual UUIDs from your database)
-- Uncomment and modify the lines below to test subscription creation
/*
DO $$
DECLARE
  test_club_id UUID;
  test_user_id UUID;
BEGIN
  -- Get first available club and user
  SELECT id INTO test_club_id FROM public.clubs LIMIT 1;
  SELECT id INTO test_user_id FROM public.users LIMIT 1;
  
  IF test_club_id IS NOT NULL AND test_user_id IS NOT NULL THEN
    INSERT INTO public.club_subscriptions (club_id, user_id) VALUES
      (test_club_id, test_user_id)
    ON CONFLICT (club_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Test subscription created for club % and user %', test_club_id, test_user_id;
  ELSE
    RAISE NOTICE 'No clubs or users available for testing';
  END IF;
END $$;
*/

-- 8. Show final subscription count
SELECT 
  COUNT(*) as final_subscription_count,
  'Final count' as status
FROM public.club_subscriptions;
