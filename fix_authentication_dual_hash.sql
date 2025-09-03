-- Fix Authentication System - Dual Hash Support (BCrypt + SHA256)
-- This allows users with either bcrypt or SHA256 hashed passwords to log in

-- First, install the pgcrypto extension if not already installed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.verify_password(input_password TEXT, stored_hash TEXT);
DROP FUNCTION IF EXISTS public.verify_password(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.show_hash_distribution();

-- Update the hash_password function to use bcrypt for new passwords
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use bcrypt with cost factor 12 (good balance of security vs performance)
  RETURN crypt(password, gen_salt('bf', 12));
END;
$$;

-- Create a function to verify passwords that handles BOTH bcrypt and SHA256
-- This is the key function that makes dual-hash authentication work
CREATE OR REPLACE FUNCTION public.verify_password(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- First try bcrypt verification (for new passwords and existing bcrypt hashes)
  IF crypt(input_password, stored_hash) = stored_hash THEN
    RETURN TRUE;
  END IF;
  
  -- If bcrypt fails, try SHA256 (for old passwords that use SHA256)
  IF stored_hash = encode(digest(input_password || 'salt_key_here', 'sha256'), 'hex') THEN
    RETURN TRUE;
  END IF;
  
  -- If neither works, return false
  RETURN FALSE;
END;
$$;

-- Update the authenticate_user function to use the dual-hash verification
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
    -- Find user with matching email
    SELECT * INTO user_record
    FROM public.manual_users
    WHERE email = user_email 
    AND is_active = true
    AND user_status = 'active';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid email or password');
    END IF;

    -- Determine hash type for logging/debugging
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
        'expires_at', expires_at,
        'hash_type_used', hash_type -- For debugging
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update the create_user function to use bcrypt for new users
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

    -- Insert new user with bcrypt-hashed password
    INSERT INTO public.manual_users (
        email, password_hash, full_name, department, student_id, employee_id, role, user_status, email_verified
    ) VALUES (
        user_email, 
        public.hash_password(user_password), -- This now uses bcrypt
        user_full_name, 
        user_department, 
        user_student_id, 
        user_employee_id, 
        user_role,
        'active', -- Set to active for demo
        true      -- Set to verified for demo
    ) RETURNING id INTO new_user_id;

    -- Insert user role
    INSERT INTO public.user_roles (user_id, role) VALUES (new_user_id, user_role);

    RETURN json_build_object('success', true, 'user_id', new_user_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to show current hash distribution
CREATE OR REPLACE FUNCTION public.show_hash_distribution()
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
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.manual_users), 2) as percentage
    FROM public.manual_users
    GROUP BY 
        CASE 
            WHEN password_hash LIKE '$2a$%' THEN 'bcrypt'
            ELSE 'sha256'
        END
    ORDER BY hash_type;
END;
$$;

-- Test the dual-hash system
SELECT 'Dual-hash authentication system installed successfully!' as status;
