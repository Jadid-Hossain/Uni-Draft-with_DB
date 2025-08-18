-- Debug script to check users table structure and data
-- Run this in your Supabase SQL editor to diagnose the 400 error

-- 1. Check if the users table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('users', 'manual_users')
ORDER BY table_name;

-- 2. Check the structure of both tables
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 3. Check if there are any RLS policies
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
WHERE tablename IN ('users', 'manual_users');

-- 4. Check if the current user has access to the table
SELECT has_table_privilege('users', 'SELECT') as can_select_users;
SELECT has_table_privilege('manual_users', 'SELECT') as can_select_manual_users;

-- 5. Check sample data (if accessible)
SELECT id, email, full_name, role, status 
FROM users 
LIMIT 5;

-- 6. Check for any constraints that might cause issues
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;

-- 7. Test a simple query to see what error we get
-- This should help identify the exact issue
SELECT COUNT(*) FROM users;
