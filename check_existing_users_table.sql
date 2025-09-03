-- Check Existing Users Table Structure
-- This will show us what's in your current users table

-- 1. Check the structure of the existing users table
SELECT 
    'Users Table Structure' as info_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check if there are any password-related columns
SELECT 
    'Password Columns Check' as info_type,
    column_name,
    data_type,
    CASE 
        WHEN column_name LIKE '%password%' OR column_name LIKE '%hash%' THEN '🔐 PASSWORD RELATED'
        ELSE '📝 OTHER'
    END as column_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND (column_name LIKE '%password%' OR column_name LIKE '%hash%')
ORDER BY column_name;

-- 3. Check how many users exist
SELECT 
    'User Count' as info_type,
    COUNT(*) as total_users
FROM users;

-- 4. Check sample user data (without sensitive info)
SELECT 
    'Sample Users' as info_type,
    id,
    email,
    full_name,
    role,
    status,
    created_at
FROM users 
LIMIT 5;

-- 5. Check if there are any authentication functions
SELECT 
    'Auth Functions' as info_type,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%auth%'
ORDER BY routine_name;

-- 6. Check if Supabase auth is being used
SELECT 
    'Supabase Auth Check' as info_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auth.users') THEN '✅ Supabase Auth Table Exists'
        ELSE '❌ No Supabase Auth Table'
    END as status;

-- 7. Check for any custom authentication tables
SELECT 
    'Custom Auth Tables' as info_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('manual_users', 'custom_users', 'auth_users')
ORDER BY table_name;

-- 8. Check what authentication system your app is using
SELECT 
    'Current Auth System' as info_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auth.users') THEN 'Supabase Native Auth'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'manual_users') THEN 'Custom Manual Auth'
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'authenticate_user') THEN 'Custom Function Auth'
        ELSE 'Unknown/No Auth System'
    END as auth_system;
