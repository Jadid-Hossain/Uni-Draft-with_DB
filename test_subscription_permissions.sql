-- Test Club Subscription Permissions and Database Connection
-- This script helps verify that the subscription system is working properly

-- 1. Check if the club_subscriptions table exists and has correct structure
SELECT 
  table_name,
  'Table exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'club_subscriptions';

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'club_subscriptions'
ORDER BY ordinal_position;

-- 3. Check if there are any existing subscriptions
SELECT 
  COUNT(*) as total_subscriptions,
  'Current subscriptions' as status
FROM public.club_subscriptions;

-- 4. Check if there are any clubs and users to test with
SELECT 
  COUNT(*) as total_clubs,
  'Available clubs' as status
FROM public.clubs;

SELECT 
  COUNT(*) as total_users,
  'Available users' as status
FROM public.users;

-- 5. Show sample clubs and users for testing
SELECT 
  id,
  name,
  'Club' as type
FROM public.clubs 
LIMIT 5;

SELECT 
  id,
  full_name,
  'User' as type
FROM public.users 
LIMIT 5;

-- 6. Test inserting a subscription (replace with actual UUIDs from your database)
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
    -- Try to insert a test subscription
    INSERT INTO public.club_subscriptions (club_id, user_id) VALUES
      (test_club_id, test_user_id)
    ON CONFLICT (club_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Test subscription created for club % and user %', test_club_id, test_user_id;
    
    -- Verify the subscription was created
    IF EXISTS (SELECT 1 FROM public.club_subscriptions WHERE club_id = test_club_id AND user_id = test_user_id) THEN
      RAISE NOTICE 'SUCCESS: Subscription verified in database';
    ELSE
      RAISE NOTICE 'ERROR: Subscription not found in database';
    END IF;
    
  ELSE
    RAISE NOTICE 'No clubs or users available for testing';
  END IF;
END $$;
*/

-- 7. Check current subscription count after any test insertions
SELECT 
  COUNT(*) as final_subscription_count,
  'Final count' as status
FROM public.club_subscriptions;

-- 8. Show any existing subscriptions with details
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
ORDER BY cs.subscribed_at DESC
LIMIT 10;
