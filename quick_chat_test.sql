-- Quick Chat Test - Run this to get chat working immediately

-- 1. Check if you have users
SELECT id, email, full_name FROM public.users LIMIT 3;

-- 2. Create a test conversation (replace USER_ID_HERE with an actual user ID from step 1)
-- Copy the UUID from step 1 and replace USER_ID_HERE below
INSERT INTO public.conversations (name, type, created_by) 
VALUES ('Test Chat', 'direct', 'USER_ID_HERE')
ON CONFLICT DO NOTHING
RETURNING id;

-- 3. Add the user as a participant (replace CONVERSATION_ID_HERE with the ID from step 2)
-- Copy the UUID from step 2 and replace CONVERSATION_ID_HERE below
INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin) 
VALUES ('CONVERSATION_ID_HERE', 'USER_ID_HERE', true)
ON CONFLICT DO NOTHING;

-- 4. Insert a welcome message
INSERT INTO public.messages (conversation_id, sender_id, sender_name, content) 
VALUES ('CONVERSATION_ID_HERE', 'USER_ID_HERE', 'System', 'Welcome to the chat! Start typing to send messages.')
ON CONFLICT DO NOTHING;

-- 5. Verify everything is set up
SELECT 
  'Conversation' as type,
  c.name,
  c.id
FROM public.conversations c
WHERE c.id = 'CONVERSATION_ID_HERE'

UNION ALL

SELECT 
  'Participant' as type,
  u.email as name,
  cp.user_id as id
FROM public.conversation_participants cp
JOIN public.users u ON cp.user_id = u.id
WHERE cp.conversation_id = 'CONVERSATION_ID_HERE'

UNION ALL

SELECT 
  'Message' as type,
  m.content as name,
  m.id
FROM public.messages m
WHERE m.conversation_id = 'CONVERSATION_ID_HERE';

-- 6. Enable realtime on messages table (if not already enabled)
-- Go to Supabase Dashboard -> Database -> Replication -> Enable realtime on 'messages' table
