-- Check Current Database Structure
-- This will help understand what exists and what needs to be fixed

-- 1. Check all tables in the database
SELECT 
    'All Tables' as info_type,
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check user-related tables specifically
SELECT 
    'User Tables' as info_type,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND (table_name LIKE '%user%' OR table_name LIKE '%auth%' OR table_name LIKE '%profile%')
ORDER BY table_name;

-- 3. Check the structure of user-related tables
SELECT 
    'Table Structure' as info_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (table_name LIKE '%user%' OR table_name LIKE '%auth%' OR table_name LIKE '%profile%')
)
ORDER BY table_name, ordinal_position;

-- 4. Check existing functions
SELECT 
    'Existing Functions' as info_type,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_user', 'authenticate_user', 'hash_password', 'verify_password', 'show_hash_distribution')
ORDER BY routine_name;

-- 5. Check function parameters for conflicting functions
SELECT 
    'Function Parameters' as info_type,
    p.specific_name,
    p.parameter_name,
    p.data_type,
    p.parameter_mode
FROM information_schema.parameters p
JOIN information_schema.routines r ON p.specific_name = r.specific_name
WHERE r.routine_schema = 'public' 
AND r.routine_name IN ('create_user', 'authenticate_user', 'hash_password', 'verify_password')
ORDER BY p.specific_name, p.ordinal_position;

-- 6. Check custom types and enums
SELECT 
    'Custom Types' as info_type,
    typname as type_name,
    typtype as type_category,
    CASE 
        WHEN typtype = 'e' THEN 'ENUM'
        WHEN typtype = 'c' THEN 'COMPOSITE'
        WHEN typtype = 'd' THEN 'DOMAIN'
        ELSE 'OTHER'
    END as type_type
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typtype IN ('e', 'c', 'd');

-- 7. Check if pgcrypto extension is available
SELECT 
    'Extensions' as info_type,
    extname as extension_name,
    extversion as version,
    CASE 
        WHEN extname = 'pgcrypto' THEN '✅ Available'
        ELSE '❌ Not Available'
    END as status
FROM pg_extension 
WHERE extname = 'pgcrypto';

-- 8. Check RLS policies
SELECT 
    'RLS Policies' as info_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 9. Check sample data in user tables (if accessible)
DO $$
DECLARE
    table_record RECORD;
    user_count INTEGER;
BEGIN
    RAISE NOTICE 'Checking user data in tables...';
    
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name LIKE '%user%' OR table_name LIKE '%auth%' OR table_name LIKE '%profile%')
    LOOP
        BEGIN
            EXECUTE 'SELECT COUNT(*) FROM ' || table_record.table_name INTO user_count;
            RAISE NOTICE 'Table %: % users', table_record.table_name, user_count;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Table %: Cannot access (RLS or permissions issue)', table_record.table_name;
        END;
    END LOOP;
END $$;

-- 10. Summary
SELECT 'Database structure check completed!' as summary;
