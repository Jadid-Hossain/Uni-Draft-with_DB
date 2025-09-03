-- Add profile columns for admin and faculty users
-- This script adds the necessary columns to support different profile types

-- Add employee_id column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- Add courses_taught column for faculty (stores courses as text, one per line)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS courses_taught TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN public.users.employee_id IS 'Employee ID for admin and faculty users';
COMMENT ON COLUMN public.users.courses_taught IS 'Courses taught by faculty members (one per line)';

-- Update existing users to have employee_id if they don't have student_id
-- This is for existing admin/faculty users
UPDATE public.users 
SET employee_id = 'EMP-' || LPAD(EXTRACT(EPOCH FROM created_at)::TEXT, 10, '0')
WHERE employee_id IS NULL 
  AND student_id IS NULL 
  AND role IN ('admin', 'faculty');

-- Create an index on employee_id for better performance
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON public.users(employee_id);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('employee_id', 'courses_taught')
ORDER BY column_name;
