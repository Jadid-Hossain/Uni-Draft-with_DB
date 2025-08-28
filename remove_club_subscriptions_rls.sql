-- Remove All RLS Policies from Club Subscriptions
-- This script removes all RLS policies and disables RLS entirely

-- 1. Check current RLS status
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status,
  'Current RLS Status' as info
FROM pg_tables 
WHERE tablename = 'club_subscriptions';

-- 1b. Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  'Existing Policy' as info
FROM pg_policies 
WHERE tablename = 'club_subscriptions';

-- 2. Drop all existing policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'club_subscriptions'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.club_subscriptions';
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- 3. Disable RLS entirely
ALTER TABLE public.club_subscriptions DISABLE ROW LEVEL SECURITY;

-- 4. Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status,
  'Final RLS Status' as info
FROM pg_tables 
WHERE tablename = 'club_subscriptions';

-- 5. Verify no policies remain
SELECT 
  COUNT(*) as remaining_policies,
  'Policies remaining' as info
FROM pg_policies 
WHERE tablename = 'club_subscriptions';

-- 6. Test that the table is accessible
-- This should return the table structure without RLS restrictions
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'club_subscriptions'
ORDER BY ordinal_position;
