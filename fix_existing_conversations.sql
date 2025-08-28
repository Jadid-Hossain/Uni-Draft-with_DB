-- Fix existing conversations to ensure both users are participants
-- This script will fix the messaging issues for ALL users, not just specific ones

-- 1. First, let's see what conversations exist
SELECT 'Current conversations:' as info;
SELECT id, name, type, created_by, created_at 
FROM conversations2 
WHERE type = 'direct' 
ORDER BY created_at DESC;

-- 2. Check participants for each conversation
SELECT 'Current participants:' as info;
SELECT cp.conversation_id, cp.user_id, u.full_name, u.email, cp.is_admin
FROM conversation_participants2 cp
JOIN users u ON cp.user_id::uuid = u.id
ORDER BY cp.conversation_id, cp.user_id;

-- 3. Fix conversation names to be more descriptive (safe - only updates names)
UPDATE conversations2 
SET name = CASE 
  WHEN name NOT LIKE 'Chat with %' AND name NOT LIKE 'Group: %' THEN 'Chat with ' || name
  ELSE name
END
WHERE type = 'direct' AND name NOT LIKE 'Chat with %';

-- 4. Find conversations that are missing participants
-- This will identify conversations where only one user is a participant
WITH conversation_participant_counts AS (
  SELECT 
    conversation_id,
    COUNT(*) as participant_count
  FROM conversation_participants2
  GROUP BY conversation_id
),
missing_participants AS (
  SELECT 
    c.id as conversation_id,
    c.created_by,
    c.name
  FROM conversations2 c
  JOIN conversation_participant_counts cpc ON c.id = cpc.conversation_id
  WHERE c.type = 'direct' 
    AND cpc.participant_count = 1  -- Only one participant
    AND c.created_by IS NOT NULL
)
SELECT 'Conversations missing participants:' as info, * FROM missing_participants;

-- 5. For direct conversations, ensure both participants are added
-- This will work for ANY direct conversation that's missing participants
INSERT INTO conversation_participants2 (conversation_id, user_id, is_admin)
SELECT DISTINCT
  c.id as conversation_id,
  c.created_by as user_id,
  true as is_admin
FROM conversations2 c
LEFT JOIN conversation_participants2 cp ON c.id = cp.conversation_id AND cp.user_id = c.created_by
WHERE c.type = 'direct' 
  AND c.created_by IS NOT NULL
  AND cp.conversation_id IS NULL  -- User not already a participant
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- 6. Verify the fix worked
SELECT 'After fix - participants:' as info;
SELECT cp.conversation_id, cp.user_id, u.full_name, u.email, cp.is_admin
FROM conversation_participants2 cp
JOIN users u ON cp.user_id::uuid = u.id
ORDER BY cp.conversation_id, cp.user_id;

-- 7. Check messages are accessible for all users
SELECT 'Messages accessible to participants:' as info;
SELECT 
  m.conversation_id,
  m.sender_id,
  m.sender_name,
  m.content,
  m.created_at,
  COUNT(cp.user_id) as participant_count
FROM messages2 m
JOIN conversation_participants2 cp ON m.conversation_id = cp.conversation_id
GROUP BY m.id, m.conversation_id, m.sender_id, m.sender_name, m.content, m.created_at
ORDER BY m.created_at;
