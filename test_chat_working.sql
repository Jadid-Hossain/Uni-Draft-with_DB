-- Test Chat Working - Run this after simple_chat_setup.sql

-- 1. Check if tables exist and have data
SELECT 
  'conversations' as table_name,
  COUNT(*) as count
FROM public.conversations

UNION ALL

SELECT 
  'messages' as table_name,
  COUNT(*) as count
FROM public.messages;

-- 2. Check the welcome conversation
SELECT 
  c.name,
  c.type,
  c.created_by,
  m.content as last_message,
  m.created_at as message_time
FROM public.conversations c
LEFT JOIN public.messages m ON c.id = m.conversation_id
ORDER BY m.created_at DESC
LIMIT 1;

-- 3. Test inserting a new message (replace with actual conversation ID)
-- First, get a conversation ID:
SELECT id, name FROM public.conversations LIMIT 1;

-- Then insert a test message (replace CONVERSATION_ID_HERE with the ID from above):
-- INSERT INTO public.messages (conversation_id, sender_id, sender_name, content) 
-- VALUES (
--   'CONVERSATION_ID_HERE',
--   '6e283322-4819-4c02-aabb-caa8a65a5461',
--   'Rakib Islam',
--   'Hello! This is a test message.'
-- ) RETURNING *;

-- 4. Verify realtime is enabled
SELECT 
  schemaname,
  tablename,
  replication_identity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'messages';

-- 5. Check RLS policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'messages');
