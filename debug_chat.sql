-- Debug Chat System - Check current state and create test data

-- 1. Check if tables exist and their structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('conversations', 'conversation_participants', 'messages')
ORDER BY table_name, ordinal_position;

-- 2. Check if there are any conversations
SELECT 'conversations' as table_name, COUNT(*) as count FROM public.conversations
UNION ALL
SELECT 'conversation_participants' as table_name, COUNT(*) as count FROM public.conversation_participants
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as count FROM public.messages;

-- 3. Check current user (replace with actual user ID from your auth system)
-- First, let's see what users exist
SELECT id, email, full_name FROM public.users LIMIT 5;

-- 4. Create test conversation and participants (replace user IDs with actual ones)
-- You'll need to replace these UUIDs with actual user IDs from your users table

-- First, let's create a test conversation
INSERT INTO public.conversations (name, type, created_by) 
VALUES ('Test Chat Room', 'group', (SELECT id FROM public.users LIMIT 1))
ON CONFLICT DO NOTHING
RETURNING id;

-- Now add participants (replace the conversation_id with the one returned above)
-- You'll need to manually update this conversation_id after running the insert above
-- INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin) 
-- VALUES 
--   ('CONVERSATION_ID_HERE', (SELECT id FROM public.users LIMIT 1), true),
--   ('CONVERSATION_ID_HERE', (SELECT id FROM public.users LIMIT 1 OFFSET 1), false);

-- 5. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'conversation_participants', 'messages');

-- 6. Test RLS by checking if current user can see conversations
-- This will help debug permission issues
SELECT 
  c.id,
  c.name,
  c.type,
  cp.user_id,
  cp.is_admin
FROM public.conversations c
JOIN public.conversation_participants cp ON c.id = cp.conversation_id
WHERE cp.user_id = auth.uid(); -- This will show what the current authenticated user can see

-- 7. Check if realtime is enabled on messages table
SELECT 
  schemaname,
  tablename,
  replication_identity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'messages';

-- 8. Manual test - try to insert a message (replace IDs with actual ones)
-- INSERT INTO public.messages (conversation_id, sender_id, sender_name, content) 
-- VALUES 
--   ('CONVERSATION_ID_HERE', 'USER_ID_HERE', 'Test User', 'Hello World!')
-- RETURNING *;
