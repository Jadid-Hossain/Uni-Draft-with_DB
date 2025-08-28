-- Debug conversation naming issue
-- This will help us understand why users see their own name instead of the other participant's name

-- 1. Check all direct conversations and their names
SELECT 'Direct conversations:' as info;
SELECT id, name, type, created_by, created_at 
FROM conversations2 
WHERE type = 'direct' 
ORDER BY created_at DESC;

-- 2. Check participants for each conversation
SELECT 'Conversation participants:' as info;
SELECT 
  cp.conversation_id,
  cp.user_id,
  u.full_name,
  u.email,
  cp.is_admin,
  c.name as conversation_name
FROM conversation_participants2 cp
JOIN users u ON cp.user_id::uuid = u.id
JOIN conversations2 c ON cp.conversation_id = c.id
WHERE c.type = 'direct'
ORDER BY cp.conversation_id, cp.user_id;

-- 3. Check messages to see sender information
SELECT 'Messages with sender details:' as info;
SELECT 
  m.conversation_id,
  m.sender_id,
  m.sender_name,
  m.content,
  m.created_at,
  c.name as conversation_name
FROM messages2 m
JOIN conversations2 c ON m.conversation_id = c.id
WHERE c.type = 'direct'
ORDER BY m.created_at DESC
LIMIT 10;

-- 4. Check if there are any conversations with only one participant
SELECT 'Conversations with only one participant:' as info;
SELECT 
  c.id,
  c.name,
  c.type,
  COUNT(cp.user_id) as participant_count
FROM conversations2 c
LEFT JOIN conversation_participants2 cp ON c.id = cp.conversation_id
WHERE c.type = 'direct'
GROUP BY c.id, c.name, c.type
HAVING COUNT(cp.user_id) = 1
ORDER BY c.created_at DESC;
