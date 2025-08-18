-- Create event_registrations table for storing event registration information
-- Run this in your Supabase SQL editor

-- 1. Create the event_registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  dietary_requirements TEXT,
  emergency_contact TEXT,
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended', 'no_show')),
  terms_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_registration_date ON public.event_registrations(registration_date DESC);

-- 3. Create unique constraint to prevent duplicate registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_registrations_unique ON public.event_registrations(event_id, user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Users can view their own registrations
CREATE POLICY "Users can view own registrations" ON public.event_registrations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own registrations
CREATE POLICY "Users can insert own registrations" ON public.event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own registrations
CREATE POLICY "Users can update own registrations" ON public.event_registrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own registrations
CREATE POLICY "Users can delete own registrations" ON public.event_registrations
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all registrations (you may need to adjust this based on your admin role system)
CREATE POLICY "Admins can view all registrations" ON public.event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_event_registrations_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_registrations_updated_at();

-- 8. Create function to check event capacity
CREATE OR REPLACE FUNCTION check_event_capacity()
RETURNS TRIGGER AS $$
DECLARE
  event_capacity INTEGER;
  current_registrations INTEGER;
BEGIN
  -- Get event capacity
  SELECT capacity INTO event_capacity
  FROM public.events
  WHERE id = NEW.event_id;
  
  -- If capacity is unlimited (NULL), allow registration
  IF event_capacity IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count current registrations for this event
  SELECT COUNT(*) INTO current_registrations
  FROM public.event_registrations
  WHERE event_id = NEW.event_id AND status = 'registered';
  
  -- Check if adding this registration would exceed capacity
  IF current_registrations >= event_capacity THEN
    RAISE EXCEPTION 'Event capacity limit reached. Cannot register for this event.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to check capacity before registration
CREATE TRIGGER trigger_check_event_capacity
  BEFORE INSERT ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION check_event_capacity();

-- 10. Verify table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'event_registrations'
ORDER BY ordinal_position;

-- 11. Show table constraints
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'event_registrations';

-- 12. Show indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'event_registrations';
