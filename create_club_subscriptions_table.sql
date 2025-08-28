-- Create Club Subscriptions Table
-- This table stores user subscriptions to clubs for notifications and updates

-- 1. Create the club_subscriptions table
CREATE TABLE IF NOT EXISTS public.club_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  notification_preferences JSONB DEFAULT '{"events": true, "announcements": true, "activities": true}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_subscriptions_club_id ON public.club_subscriptions(club_id);
CREATE INDEX IF NOT EXISTS idx_club_subscriptions_user_id ON public.club_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_club_subscriptions_is_active ON public.club_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_club_subscriptions_subscribed_at ON public.club_subscriptions(subscribed_at DESC);

-- 3. Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_club_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_club_subscriptions_updated_at
  BEFORE UPDATE ON public.club_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_club_subscriptions_updated_at();

-- 4. Insert some sample subscriptions for testing (optional)
-- Uncomment the lines below if you want to add test data
/*
INSERT INTO public.club_subscriptions (club_id, user_id) VALUES
  ((SELECT id FROM public.clubs LIMIT 1), (SELECT id FROM public.users LIMIT 1))
ON CONFLICT DO NOTHING;
*/

-- 5. Verify the table was created
SELECT 'Club Subscriptions Table Created Successfully!' as status;

-- Show the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'club_subscriptions'
ORDER BY ordinal_position;

-- Show the created indexes
SELECT 
  indexname,
  'Index' as object_type
FROM pg_indexes 
WHERE tablename = 'club_subscriptions'
ORDER BY indexname;
