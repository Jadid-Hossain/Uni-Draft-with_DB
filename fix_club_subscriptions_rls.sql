-- Fix Club Subscriptions RLS Policies
-- This script adds the necessary RLS policies to allow users to manage their subscriptions

-- 1. Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'club_subscriptions';

-- 2. Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'club_subscriptions';

-- 3. Enable RLS if not already enabled
ALTER TABLE public.club_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Create policy to allow users to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.club_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Create policy to allow users to insert their own subscriptions
CREATE POLICY "Users can create their own subscriptions" ON public.club_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Create policy to allow users to update their own subscriptions
CREATE POLICY "Users can update their own subscriptions" ON public.club_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Create policy to allow users to delete their own subscriptions
CREATE POLICY "Users can delete their own subscriptions" ON public.club_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Create policy to allow users to view subscription counts (for public stats)
CREATE POLICY "Anyone can view subscription counts" ON public.club_subscriptions
  FOR SELECT USING (true);

-- 9. Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'club_subscriptions'
ORDER BY policyname;

-- 10. Test the policies by checking if they're working
-- This will show the current RLS status and policies
SELECT 
  'RLS Status' as info,
  tablename,
  CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM pg_tables 
WHERE tablename = 'club_subscriptions'

UNION ALL

SELECT 
  'Policy Count' as info,
  tablename,
  COUNT(*)::text as policy_count
FROM pg_policies 
WHERE tablename = 'club_subscriptions'
GROUP BY tablename;
