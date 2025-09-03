-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view awards" ON public.club_awards;
DROP POLICY IF EXISTS "Club admins can insert awards" ON public.club_awards;
DROP POLICY IF EXISTS "Club admins can update awards" ON public.club_awards;
DROP POLICY IF EXISTS "Club admins can delete awards" ON public.club_awards;

-- Create simpler, more permissive policies for testing
-- Anyone can read awards (public information)
CREATE POLICY "Anyone can view awards" ON public.club_awards
    FOR SELECT USING (true);

-- Allow authenticated users to insert awards (for testing)
CREATE POLICY "Authenticated users can insert awards" ON public.club_awards
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update awards (for testing)
CREATE POLICY "Authenticated users can update awards" ON public.club_awards
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete awards (for testing)
CREATE POLICY "Authenticated users can delete awards" ON public.club_awards
    FOR DELETE USING (auth.uid() IS NOT NULL);
