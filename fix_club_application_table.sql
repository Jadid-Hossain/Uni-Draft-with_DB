-- Fix club_membership_application table - remove foreign key constraints
-- Execute this in your Supabase SQL Editor

-- Drop the existing table to start fresh
DROP TABLE IF EXISTS public.club_membership_application CASCADE;

-- Create the table WITHOUT foreign key constraints
CREATE TABLE public.club_membership_application (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL,
    applicant_id UUID NOT NULL,
    motivation TEXT NOT NULL,
    experience TEXT,
    skills TEXT,
    availability TEXT NOT NULL,
    expectations TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    agreed_to_terms BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (but no foreign keys)
CREATE INDEX idx_club_membership_application_club_id ON public.club_membership_application(club_id);
CREATE INDEX idx_club_membership_application_applicant_id ON public.club_membership_application(applicant_id);
CREATE INDEX idx_club_membership_application_status ON public.club_membership_application(status);

-- Enable RLS but allow all operations for simplicity
ALTER TABLE public.club_membership_application ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy to allow all operations
DROP POLICY IF EXISTS "Allow all operations on club_membership_application" ON public.club_membership_application;
CREATE POLICY "Allow all operations on club_membership_application" ON public.club_membership_application
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.club_membership_application TO anon;
GRANT ALL ON public.club_membership_application TO authenticated;

-- Test insert with your actual user ID
INSERT INTO public.club_membership_application (
    club_id, 
    applicant_id, 
    motivation, 
    availability, 
    agreed_to_terms
) VALUES (
    '73c2aee2-17a4-4548-a4d9-822f7994675e', 
    '6e283322-4819-4c02-aabb-caa8a65a5461', 
    'Test application for joining the club', 
    'Available on weekends', 
    true
);

-- Verify the insert worked
SELECT * FROM public.club_membership_application ORDER BY created_at DESC LIMIT 1;
