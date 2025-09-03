-- Complete Function Cleanup - Remove ALL conflicting functions
-- This will resolve the "Could not choose the best candidate function" error

-- 1. Drop ALL possible variations of conflicting functions
DROP FUNCTION IF EXISTS public.create_user(user_email TEXT, user_password TEXT, user_full_name TEXT, user_department TEXT, user_student_id TEXT, user_employee_id TEXT, user_role public.app_role);
DROP FUNCTION IF EXISTS public.create_user(user_email TEXT, user_password TEXT, user_full_name TEXT, user_department TEXT, user_student_id TEXT, user_employee_id TEXT, user_role TEXT);
DROP FUNCTION IF EXISTS public.create_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, public.app_role);
DROP FUNCTION IF EXISTS public.create_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- 2. Drop ALL authentication functions completely
DROP FUNCTION IF EXISTS public.authenticate_user(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.authenticate_user_manual(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.hash_password(TEXT);
DROP FUNCTION IF EXISTS public.verify_password(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.show_password_hash_distribution();

-- 3. Check what functions remain
SELECT 
    'Remaining Functions' as info_type,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_user', 'authenticate_user', 'hash_password', 'verify_password', 'show_password_hash_distribution')
ORDER BY routine_name;

-- 4. Show cleanup status
SELECT 'All conflicting functions dropped successfully!' as status;
