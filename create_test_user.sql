-- Create test users for development
-- Execute this after running the main database_auth_functions.sql

-- Create a test student
SELECT public.create_user(
    'student@bracu.ac.bd',
    'password123',
    'John Doe',
    'Computer Science',
    '20101234',
    null,
    'student'
);

-- Create a test faculty
SELECT public.create_user(
    'faculty@bracu.ac.bd',
    'password123',
    'Dr. Jane Smith',
    'Computer Science',
    null,
    'FAC001',
    'faculty'
);

-- Create a test admin
SELECT public.create_user(
    'admin@bracu.ac.bd',
    'password123',
    'Admin User',
    'Administration',
    null,
    'ADM001',
    'admin'
);

-- Create some test clubs (make sure clubs table exists first)
INSERT INTO public.clubs (name, description, is_public, created_by) 
SELECT 
    'Programming Club',
    'A club for students interested in programming and software development',
    true,
    u.id
FROM public.manual_users u 
WHERE u.email = 'faculty@bracu.ac.bd'
ON CONFLICT DO NOTHING;

INSERT INTO public.clubs (name, description, is_public, created_by) 
SELECT 
    'Robotics Club',
    'Explore the world of robotics and automation',
    true,
    u.id
FROM public.manual_users u 
WHERE u.email = 'faculty@bracu.ac.bd'
ON CONFLICT DO NOTHING;

INSERT INTO public.clubs (name, description, is_public, created_by) 
SELECT 
    'Business Club',
    'For students interested in business and entrepreneurship',
    true,
    u.id
FROM public.manual_users u 
WHERE u.email = 'admin@bracu.ac.bd'
ON CONFLICT DO NOTHING;
