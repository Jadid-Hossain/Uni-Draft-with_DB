-- Query to check club applications in Supabase
-- Run this in your Supabase SQL Editor to see all applications

SELECT 
    id,
    club_id,
    applicant_id,
    motivation,
    experience,
    skills,
    availability,
    expectations,
    status,
    application_date,
    agreed_to_terms,
    created_at
FROM public.club_membership_application 
ORDER BY created_at DESC;

-- Count applications by status
SELECT 
    status, 
    COUNT(*) as count 
FROM public.club_membership_application 
GROUP BY status;

-- Recent applications (last 24 hours)
SELECT 
    id,
    club_id,
    applicant_id,
    motivation,
    status,
    created_at
FROM public.club_membership_application 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
