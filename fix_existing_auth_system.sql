-- Fix Existing Custom Authentication System
-- This will fix your current users table and authentication functions

-- 1. First, install pgcrypto extension if not available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Drop all conflicting authentication functions
DROP FUNCTION IF EXISTS public.authenticate_user(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.authenticate_user_manual(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.hash_password(TEXT);
DROP FUNCTION IF EXISTS public.verify_password(TEXT, TEXT);

-- 3. Create a dual-hash password verification function
CREATE OR REPLACE FUNCTION public.verify_password(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- First try bcrypt verification (for existing bcrypt hashes)
  IF crypt(input_password, stored_hash) = stored_hash THEN
    RETURN TRUE;
  END IF;
  
  -- If bcrypt fails, try SHA256 (for existing SHA256 hashes)
  IF stored_hash = encode(digest(input_password || 'salt_key_here', 'sha256'), 'hex') THEN
    RETURN TRUE;
  END IF;
  
  -- If neither works, return false
  RETURN FALSE;
END;
$$;

-- 4. Create a new hash_password function that uses bcrypt for new passwords
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use bcrypt with cost factor 12 for new passwords
  RETURN crypt(password, gen_salt('bf', 12));
END;
$$;

-- 5. Fix the main authenticate_user function to work with your existing users table
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
    hash_type TEXT;
BEGIN
    -- Find user with matching email in your existing users table
    SELECT * INTO user_record
    FROM public.users
    WHERE email = user_email 
    AND is_active = true
    AND (user_status = 'active' OR user_status IS NULL OR status = 'approved');

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid email or password');
    END IF;

    -- Determine hash type for debugging
    IF user_record.password_hash LIKE '$2a$%' THEN
        hash_type := 'bcrypt';
    ELSE
        hash_type := 'sha256';
    END IF;

    -- Verify password using the dual-hash function
    IF NOT public.verify_password(user_password, user_record.password_hash) THEN
        RETURN json_build_object('success', false, 'error', 'Invalid email or password');
    END IF;

    -- Generate session token
    session_token := encode(gen_random_bytes(32), 'base64');
    expires_at := NOW() + INTERVAL '7 days';

    -- Insert session into user_sessions table
    INSERT INTO public.user_sessions (user_id, session_token, expires_at)
    VALUES (user_record.id, session_token, expires_at);

    -- Update last login
    UPDATE public.users 
    SET last_login_at = NOW() 
    WHERE id = user_record.id;

    -- Build user object matching your app's expected format
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
            'email_verified', user_record.email_verified,
            'club_admin', user_record.club_admin
        ),
        'session_token', session_token,
        'expires_at', expires_at,
        'hash_type_used', hash_type
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 6. Create a function to show password hash distribution
CREATE OR REPLACE FUNCTION public.show_password_hash_distribution()
RETURNS TABLE(
    hash_type TEXT,
    user_count BIGINT,
    percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN password_hash LIKE '$2a$%' THEN 'bcrypt'
            ELSE 'sha256'
        END as hash_type,
        COUNT(*) as user_count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.users), 2) as percentage
    FROM public.users
    GROUP BY 
        CASE 
            WHEN password_hash LIKE '$2a$%' THEN 'bcrypt'
            ELSE 'sha256'
        END
    ORDER BY hash_type;
END;
$$;

-- 7. Test the fix
SELECT 'Authentication system fixed successfully!' as status;

-- 8. Show current password hash distribution
SELECT 
    'Password Hash Distribution' as info_type,
    hash_type,
    user_count,
    percentage || '%' as percentage
FROM public.show_password_hash_distribution();
