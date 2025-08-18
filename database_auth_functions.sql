-- Authentication Functions for BRAC University Portal
-- Execute these functions in your Supabase SQL Editor

-- First, create the required tables if they don't exist

-- Users table (manual authentication)
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

-- User sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.manual_users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.manual_users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.manual_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.manual_users
    FOR SELECT USING (auth.uid()::text = id::text OR current_setting('app.current_user_id', true) = id::text);

CREATE POLICY "Users can update own profile" ON public.manual_users
    FOR UPDATE USING (auth.uid()::text = id::text OR current_setting('app.current_user_id', true) = id::text);

-- Session context functions
CREATE OR REPLACE FUNCTION public.set_session_context(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, true);
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_session_context()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_user_id', '', true);
END;
$$;

-- Password hashing function (simple for demo - use bcrypt in production)
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple hash for demo - in production use proper bcrypt
  RETURN encode(digest(password || 'salt_key_here', 'sha256'), 'hex');
END;
$$;

-- Create user function
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

    -- Insert new user
    INSERT INTO public.manual_users (
        email, password_hash, full_name, department, student_id, employee_id, role, user_status, email_verified
    ) VALUES (
        user_email, 
        public.hash_password(user_password), 
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

-- Authenticate user function
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
    -- Find user with matching email and password
    SELECT * INTO user_record
    FROM public.manual_users
    WHERE email = user_email 
    AND password_hash = public.hash_password(user_password)
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

-- Validate session function
CREATE OR REPLACE FUNCTION public.validate_session(token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_record RECORD;
    user_record RECORD;
    result JSON;
BEGIN
    -- Find active session
    SELECT s.*, u.*
    INTO session_record
    FROM public.user_sessions s
    JOIN public.manual_users u ON s.user_id = u.id
    WHERE s.session_token = token
    AND s.expires_at > NOW()
    AND s.is_active = true
    AND u.is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or expired session');
    END IF;

    -- Build result
    result := json_build_object(
        'success', true,
        'user', json_build_object(
            'id', session_record.id,
            'email', session_record.email,
            'full_name', session_record.full_name,
            'department', session_record.department,
            'student_id', session_record.student_id,
            'employee_id', session_record.employee_id,
            'role', session_record.role,
            'user_status', session_record.user_status,
            'is_active', session_record.is_active,
            'email_verified', session_record.email_verified
        )
    );

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Logout user function
CREATE OR REPLACE FUNCTION public.logout_user(token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Deactivate session
    UPDATE public.user_sessions
    SET is_active = false
    WHERE session_token = token;

    RETURN json_build_object('success', true);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create some test data (optional)
-- You can run this to create a test user
-- SELECT public.create_user(
--     'test@bracu.ac.bd',
--     'password123',
--     'Test User',
--     'Computer Science',
--     '20101234',
--     null,
--     'student'
-- );
