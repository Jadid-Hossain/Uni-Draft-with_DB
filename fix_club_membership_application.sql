-- Fix club_membership_application table structure
-- This script ensures the table can properly join with users table

-- 1. Check current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'club_membership_application' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if table exists and has correct structure
DO $$
BEGIN
    -- Drop table if it exists to recreate with correct structure
    DROP TABLE IF EXISTS public.club_membership_application CASCADE;
    
    -- Create the table with proper structure
    CREATE TABLE public.club_membership_application (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID NOT NULL,
        user_id TEXT NOT NULL, -- Using TEXT to avoid FK constraints
        motivation TEXT NOT NULL,
        experience TEXT,
        skills TEXT,
        availability TEXT NOT NULL,
        expectations TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
        application_date TIMESTAMPTZ DEFAULT NOW(),
        agreed_to_terms BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE 'club_membership_application table created successfully';
END $$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_membership_application_club_id ON public.club_membership_application(club_id);
CREATE INDEX IF NOT EXISTS idx_club_membership_application_user_id ON public.club_membership_application(user_id);
CREATE INDEX IF NOT EXISTS idx_club_membership_application_status ON public.club_membership_application(status);

-- 4. Enable RLS
ALTER TABLE public.club_membership_application ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
DROP POLICY IF EXISTS "Club leaders can view applications" ON public.club_membership_application;
CREATE POLICY "Club leaders can view applications" ON public.club_membership_application
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE id = club_membership_application.club_id
            AND created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Club leaders can update applications" ON public.club_membership_application;
CREATE POLICY "Club leaders can update applications" ON public.club_membership_application
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE id = club_membership_application.club_id
            AND created_by = auth.uid()
        )
    );

-- 6. Create function to update timestamps
CREATE OR REPLACE FUNCTION update_club_membership_application_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for timestamp updates
DROP TRIGGER IF EXISTS trigger_update_club_membership_application_updated_at ON public.club_membership_application;
CREATE TRIGGER trigger_update_club_membership_application_updated_at
    BEFORE UPDATE ON public.club_membership_application
    FOR EACH ROW
    EXECUTE FUNCTION update_club_membership_application_updated_at();

-- 8. Grant permissions
GRANT ALL ON public.club_membership_application TO anon;
GRANT ALL ON public.club_membership_application TO authenticated;

-- 9. Insert sample data for testing (optional)
INSERT INTO public.club_membership_application (
    club_id,
    user_id,
    motivation,
    experience,
    skills,
    availability,
    expectations,
    agreed_to_terms
) VALUES 
(
    (SELECT id FROM public.clubs LIMIT 1),
    'test-user-123',
    'I am passionate about this club and want to contribute',
    'I have experience in related activities',
    'Leadership, Communication, Teamwork',
    'Available on weekends and evenings',
    'I hope to learn new skills and make friends',
    true
);

-- 10. Verify the table structure
SELECT 
    'Table created successfully' as status,
    COUNT(*) as total_applications
FROM public.club_membership_application;

-- 11. Test the join query that ClubDashboard uses
SELECT 
    cma.*,
    u.full_name,
    u.email,
    u.student_id,
    u.department
FROM public.club_membership_application cma
LEFT JOIN public.users u ON cma.user_id = u.id
LIMIT 5;
