-- Check and Create Missing Authentication Tables
-- This script will check what exists and create what's missing

-- 1. First, let's see what tables exist
SELECT 
    'Existing Tables' as info_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%user%'
ORDER BY table_name;

-- 2. Check if the app_role enum exists
SELECT 
    'Enum Check' as info_type,
    typname as enum_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM pg_type 
WHERE typname = 'app_role';

-- 3. Create the app_role enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'faculty', 'student');
        RAISE NOTICE 'Created app_role enum';
    ELSE
        RAISE NOTICE 'app_role enum already exists';
    END IF;
END $$;

-- 4. Create the manual_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.manual_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL,
    student_id TEXT,
    employee_id TEXT,
    role public.app_role NOT NULL DEFAULT 'student',
    user_status TEXT DEFAULT 'pending' CHECK (user_status IN ('pending', 'active', 'suspended', 'rejected')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create the user_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.manual_users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 6. Create the user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.manual_users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 7. Enable RLS on all tables
ALTER TABLE public.manual_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 8. Create basic RLS policies
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.manual_users
    FOR SELECT USING (current_setting('app.current_user_id', true) = id::text);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.manual_users
    FOR UPDATE USING (current_setting('app.current_user_id', true) = id::text);

CREATE POLICY IF NOT EXISTS "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (current_setting('app.current_user_id', true) = user_id::text);

CREATE POLICY IF NOT EXISTS "Users can view own roles" ON public.user_roles
    FOR SELECT USING (current_setting('app.current_user_id', true) = user_id::text);

-- 9. Check if you have existing users in a different table
SELECT 
    'Existing User Tables' as info_type,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('users', 'auth_users', 'profiles')
ORDER BY table_name;

-- 10. Show the final status
SELECT 
    'Table Creation Status' as info_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'manual_users') THEN '✅ manual_users table created'
        ELSE '❌ manual_users table creation failed'
    END as status;

SELECT 
    'Ready for Authentication Fix' as next_step,
    'Now you can run the fix_authentication_dual_hash.sql script' as instruction;
