-- Remove "Chat with" prefix from conversation names
-- This will make conversation names cleaner and more professional

-- 1. Show current conversation names
SELECT 'Current conversation names:' as info;
SELECT id, name, type, created_at 
FROM conversations2 
WHERE type = 'direct' 
ORDER BY created_at DESC;

-- 2. Remove "Chat with" prefix from direct conversations
UPDATE conversations2 
SET name = REPLACE(name, 'Chat with ', '')
WHERE type = 'direct' AND name LIKE 'Chat with %';

-- 3. Show updated conversation names
SELECT 'Updated conversation names:' as info;
SELECT id, name, type, created_at 
FROM conversations2 
WHERE type = 'direct' 
ORDER BY created_at DESC;

-- 4. Verify the changes
SELECT 'Verification - all direct conversations:' as info;
SELECT id, name, type, created_at 
FROM conversations2 
WHERE type = 'direct' 
ORDER BY created_at DESC;
