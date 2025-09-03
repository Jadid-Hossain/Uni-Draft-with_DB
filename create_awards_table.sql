-- Create awards table for clubs
CREATE TABLE IF NOT EXISTS public.club_awards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    year INTEGER,
    category VARCHAR(100), -- e.g., 'Academic', 'Sports', 'Cultural', 'Technical'
    award_type VARCHAR(100), -- e.g., 'First Place', 'Best Performance', 'Recognition'
    issuer VARCHAR(255), -- Who gave the award
    image_url TEXT, -- Optional image of the award
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_club_awards_club_id ON public.club_awards(club_id);
CREATE INDEX IF NOT EXISTS idx_club_awards_year ON public.club_awards(year);
CREATE INDEX IF NOT EXISTS idx_club_awards_category ON public.club_awards(category);

-- Enable RLS (Row Level Security)
ALTER TABLE public.club_awards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Anyone can read awards (public information)
CREATE POLICY "Anyone can view awards" ON public.club_awards
    FOR SELECT USING (true);

-- Only club admins and super admins can insert awards
CREATE POLICY "Club admins can insert awards" ON public.club_awards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clubs 
            WHERE id = club_id 
            AND (created_by::text = auth.uid()::text OR club_admin::text = auth.uid()::text)
        ) OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

-- Only club admins and super admins can update awards
CREATE POLICY "Club admins can update awards" ON public.club_awards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.clubs 
            WHERE id = club_id 
            AND (created_by::text = auth.uid()::text OR club_admin::text = auth.uid()::text)
        ) OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

-- Only club admins and super admins can delete awards
CREATE POLICY "Club admins can delete awards" ON public.club_awards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.clubs 
            WHERE id = club_id 
            AND (created_by::text = auth.uid()::text OR club_admin::text = auth.uid()::text)
        ) OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_club_awards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_club_awards_updated_at
    BEFORE UPDATE ON public.club_awards
    FOR EACH ROW
    EXECUTE FUNCTION update_club_awards_updated_at();

-- Insert some sample awards for testing
INSERT INTO public.club_awards (club_id, title, description, year, category, award_type, issuer, created_by)
SELECT 
    c.id,
    'Best Computer Club Award',
    'Recognized as the best computer club in the university for outstanding contributions to technology and innovation.',
    2024,
    'Academic',
    'Recognition',
    'University Administration',
    c.created_by
FROM public.clubs c
WHERE c.name ILIKE '%computer%' OR c.name ILIKE '%tech%'
LIMIT 1;

INSERT INTO public.club_awards (club_id, title, description, year, category, award_type, issuer, created_by)
SELECT 
    c.id,
    'Inter-University Programming Contest Winners',
    'Our team secured 1st position in the national programming contest, showcasing exceptional problem-solving skills.',
    2023,
    'Technical',
    'First Place',
    'National Programming Association',
    c.created_by
FROM public.clubs c
WHERE c.name ILIKE '%computer%' OR c.name ILIKE '%tech%'
LIMIT 1;
