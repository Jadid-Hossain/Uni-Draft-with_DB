-- Simple club_membership_application table (without file upload fields)
-- Execute this in your Supabase SQL Editor

-- Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS public.club_membership_application;

-- Create the table with only the fields we're actually using
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

-- Create indexes for better performance
CREATE INDEX idx_club_membership_application_club_id ON public.club_membership_application(club_id);
CREATE INDEX idx_club_membership_application_applicant_id ON public.club_membership_application(applicant_id);
CREATE INDEX idx_club_membership_application_status ON public.club_membership_application(status);

-- Enable RLS (Row Level Security) but allow all operations for now
ALTER TABLE public.club_membership_application ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy to allow all operations
CREATE POLICY "Allow all operations on club_membership_application" ON public.club_membership_application
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to anon and authenticated users
GRANT ALL ON public.club_membership_application TO anon;
GRANT ALL ON public.club_membership_application TO authenticated;

-- Test the table by inserting a sample record
INSERT INTO public.club_membership_application (
    club_id, 
    applicant_id, 
    motivation, 
    availability, 
    agreed_to_terms
) VALUES (
    gen_random_uuid(), 
    gen_random_uuid(), 
    'Test motivation for joining the club', 
    'Available on weekends', 
    true
);

-- Check if the insert worked
SELECT * FROM public.club_membership_application ORDER BY created_at DESC LIMIT 1;
