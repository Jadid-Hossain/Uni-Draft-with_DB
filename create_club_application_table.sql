-- Create club_membership_application table
-- Execute this in your Supabase SQL Editor

-- First create the table
CREATE TABLE IF NOT EXISTS public.club_membership_application (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL,
    applicant_id UUID NOT NULL,
    motivation TEXT NOT NULL,
    experience TEXT,
    skills TEXT,
    availability TEXT NOT NULL,
    expectations TEXT,
    portfolio_file_path TEXT,
    resume_file_path TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    review_notes TEXT,
    agreed_to_terms BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_club_membership_application_club_id ON public.club_membership_application(club_id);
CREATE INDEX IF NOT EXISTS idx_club_membership_application_applicant_id ON public.club_membership_application(applicant_id);
CREATE INDEX IF NOT EXISTS idx_club_membership_application_status ON public.club_membership_application(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.club_membership_application ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow inserts and selects
CREATE POLICY "Allow all operations on club_membership_application" ON public.club_membership_application
    FOR ALL USING (true) WITH CHECK (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_club_membership_application_updated_at 
    BEFORE UPDATE ON public.club_membership_application 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.club_membership_application TO anon;
GRANT ALL ON public.club_membership_application TO authenticated;

-- Optional: Insert some test data to verify the table works
-- INSERT INTO public.club_membership_application (
--     club_id, 
--     applicant_id, 
--     motivation, 
--     availability, 
--     agreed_to_terms
-- ) VALUES (
--     gen_random_uuid(), 
--     gen_random_uuid(), 
--     'Test motivation', 
--     'Available weekends', 
--     true
-- );
