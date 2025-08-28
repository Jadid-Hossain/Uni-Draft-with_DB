-- Fix conversation names to show actual participant names
-- This will resolve the issue where users see generic names instead of actual names

-- 1. Show current conversation names
SELECT 'Current conversation names:' as info;
SELECT id, name, type, created_by, created_at 
FROM conversations2 
WHERE type = 'direct' 
ORDER BY created_at DESC;

-- 2. Update conversation names to show the other participant's name
-- For each conversation, set the name to the other participant's name
WITH conversation_updates AS (
  SELECT 
    c.id,
    c.name,
    c.created_by,
    u.full_name as creator_name,
    other_participant.full_name as other_name
  FROM conversations2 c
  JOIN users u ON c.created_by::uuid = u.id
  JOIN conversation_participants2 cp ON c.id = cp.conversation_id
  JOIN users other_participant ON cp.user_id::uuid = other_participant.id
  WHERE c.type = 'direct' 
    AND cp.user_id != c.created_by
)
UPDATE conversations2 
SET name = cu.other_name
FROM conversation_updates cu
WHERE conversations2.id = cu.id;

-- 3. Show updated conversation names
SELECT 'Updated conversation names:' as info;
SELECT id, name, type, created_by, created_at 
FROM conversations2 
WHERE type = 'direct' 
ORDER BY created_at DESC;

-- 4. Verify participants are still correct
SELECT 'Verification - participants:' as info;
SELECT 
  cp.conversation_id,
  cp.user_id,
  u.full_name,
  u.email,
  cp.is_admin
FROM conversation_participants2 cp
JOIN users u ON cp.user_id::uuid = u.id
JOIN conversations2 c ON cp.conversation_id = c.id
WHERE c.type = 'direct'
ORDER BY cp.conversation_id, cp.user_id;
