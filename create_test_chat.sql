-- Create Test Chat Data
-- Run this script in your Supabase SQL editor to create test conversations

-- 1. First, let's see what users we have
SELECT id, email, full_name FROM public.users LIMIT 5;

-- 2. Create a test conversation (replace USER_ID_HERE with an actual user ID from step 1)
INSERT INTO public.conversations (name, type, created_by) 
VALUES ('Welcome Chat Room', 'group', 'USER_ID_HERE')
ON CONFLICT DO NOTHING
RETURNING id;

-- 3. Add the current user as a participant (replace CONVERSATION_ID_HERE with the ID from step 2)
INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin) 
VALUES ('CONVERSATION_ID_HERE', 'USER_ID_HERE', true)
ON CONFLICT DO NOTHING;

-- 4. Add a few more users as participants (optional - replace with actual user IDs)
-- INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin) 
-- VALUES 
--   ('CONVERSATION_ID_HERE', 'ANOTHER_USER_ID', false),
--   ('CONVERSATION_ID_HERE', 'YET_ANOTHER_USER_ID', false);

-- 5. Insert a test message to verify everything works
INSERT INTO public.messages (conversation_id, sender_id, sender_name, content) 
VALUES ('CONVERSATION_ID_HERE', 'USER_ID_HERE', 'System', 'Welcome to the chat room!')
ON CONFLICT DO NOTHING;

-- 6. Verify the setup
SELECT 
  c.name as conversation_name,
  c.type,
  cp.user_id,
  cp.is_admin,
  m.content as last_message
FROM public.conversations c
JOIN public.conversation_participants cp ON c.id = cp.conversation_id
LEFT JOIN public.messages m ON c.id = m.conversation_id
WHERE c.id = 'CONVERSATION_ID_HERE'
ORDER BY m.created_at DESC
LIMIT 1;

-- 7. Check if realtime is working (this should show the messages table)
SELECT 
  schemaname,
  tablename,
  replication_identity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'messages';
