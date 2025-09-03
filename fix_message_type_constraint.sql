-- Fix message_type constraint issue in messages2 table
-- Run this in your Supabase SQL Editor to fix the constraint violation error

-- First, let's see what the current constraint looks like
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'messages2'::regclass 
AND conname LIKE '%message_type%';

-- Drop the existing constraint if it exists
ALTER TABLE messages2 
DROP CONSTRAINT IF EXISTS messages2_message_type_check;

-- Recreate the constraint with the correct allowed values
ALTER TABLE messages2 
ADD CONSTRAINT messages2_message_type_check 
CHECK (message_type IN ('text', 'image', 'text_with_image'));

-- Verify the constraint was created correctly
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'messages2'::regclass 
AND conname LIKE '%message_type%';

-- Also verify the columns exist and have correct defaults
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'messages2' 
AND column_name IN ('image_url', 'message_type')
ORDER BY column_name;
