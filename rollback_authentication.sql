-- Rollback Authentication System to Original State
-- This script will restore your original authentication functions
-- Run this ONLY if you want to go back to the previous system

-- 1. Restore the original hash_password function (SHA256)
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Restore to original SHA256 hashing
  RETURN encode(digest(password || 'salt_key_here', 'sha256'), 'hex');
END;
$$;

-- 2. Restore the original authenticate_user function (SHA256 only)
CREATE OR REPLACE FUNCTION public.authenticate_user(
    user_email TEXT,
    user_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    session_token TEXT;
    expires_at TIMESTAMP WITH TIME ZONE;
    result JSON;
BEGIN
    -- Find user with matching email and password (SHA256 only)
    SELECT * INTO user_record
    FROM public.manual_users
    WHERE email = user_email 
    AND password_hash = public.hash_password(user_password)  -- SHA256 only
    AND is_active = true
    AND user_status = 'active';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid email or password');
    END IF;

    -- Generate session token
    session_token := encode(gen_random_bytes(32), 'base64');
    expires_at := NOW() + INTERVAL '7 days';

    -- Insert session
    INSERT INTO public.user_sessions (user_id, session_token, expires_at)
    VALUES (user_record.id, session_token, expires_at);

    -- Update last login
    UPDATE public.manual_users 
    SET last_login_at = NOW() 
    WHERE id = user_record.id;

    -- Build user object
    result := json_build_object(
        'success', true,
        'user', json_build_object(
            'id', user_record.id,
            'email', user_record.email,
            'full_name', user_record.full_name,
            'department', user_record.department,
            'student_id', user_record.student_id,
            'employee_id', user_record.employee_id,
            'role', user_record.role,
            'user_status', user_record.user_status,
            'is_active', user_record.is_active,
            'email_verified', user_record.email_verified
        ),
        'session_token', session_token,
        'expires_at', expires_at
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 3. Restore the original create_user function (SHA256 only)
CREATE OR REPLACE FUNCTION public.create_user(
    user_email TEXT,
    user_password TEXT,
    user_full_name TEXT,
    user_department TEXT,
    user_student_id TEXT DEFAULT NULL,
    user_employee_id TEXT DEFAULT NULL,
    user_role public.app_role DEFAULT 'student'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM public.manual_users WHERE email = user_email) THEN
        RETURN json_build_object('success', false, 'error', 'Email already registered');
    END IF;

    -- Insert new user with SHA256-hashed password (original method)
    INSERT INTO public.manual_users (
        email, password_hash, full_name, department, student_id, employee_id, role, user_status, email_verified
    ) VALUES (
        user_email, 
        public.hash_password(user_password), -- SHA256 hashing
        user_full_name, 
        user_department, 
        user_student_id, 
        user_employee_id, 
        user_role,
        'active',
        true
    ) RETURNING id INTO new_user_id;

    -- Insert user role
    INSERT INTO public.user_roles (user_id, role) VALUES (new_user_id, user_role);

    RETURN json_build_object('success', true, 'user_id', new_user_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. Drop the dual-hash functions that were added
DROP FUNCTION IF EXISTS public.verify_password(input_password TEXT, stored_hash TEXT);
DROP FUNCTION IF EXISTS public.show_hash_distribution();

-- 5. Show rollback status
SELECT 'Authentication system rolled back to original SHA256-only state!' as status;

-- 6. Verify the rollback
SELECT 
    'Rollback Verification' as check_type,
    routine_name,
    CASE 
        WHEN routine_definition IS NOT NULL THEN '✅ RESTORED' 
        ELSE '❌ MISSING' 
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('hash_password', 'authenticate_user', 'create_user')
ORDER BY routine_name;
