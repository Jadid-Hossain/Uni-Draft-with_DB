-- Lost & Found Database Setup
-- This creates the lost_found_items table for students to report lost items

-- Create lost_found_items table
CREATE TABLE IF NOT EXISTS public.lost_found_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES public.manual_users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'lost' CHECK (status IN ('lost', 'found', 'claimed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lost_found_items_user_id ON public.lost_found_items(user_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_status ON public.lost_found_items(status);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_created_at ON public.lost_found_items(created_at);

-- Enable Row Level Security
ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all lost and found items" ON public.lost_found_items
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own lost and found items" ON public.lost_found_items
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR current_setting('app.current_user_id', true) = user_id::text);

CREATE POLICY "Users can update their own lost and found items" ON public.lost_found_items
    FOR UPDATE USING (auth.uid()::text = user_id::text OR current_setting('app.current_user_id', true) = user_id::text);

CREATE POLICY "Users can delete their own lost and found items" ON public.lost_found_items
    FOR DELETE USING (auth.uid()::text = user_id::text OR current_setting('app.current_user_id', true) = user_id::text);

-- Sample data (replace user_id with actual UUID values from your users table)
-- INSERT INTO public.lost_found_items (title, description, location, user_id) VALUES
-- ('Lost Laptop', 'MacBook Pro 13-inch, silver color, with a sticker on the back', 'Library - 2nd floor', 'your-user-uuid-here'),
-- ('Found Keys', 'Set of keys with a red keychain, found near the cafeteria', 'Cafeteria entrance', 'your-user-uuid-here');

/*
Current Schema:
lost_found_items:
- id (UUID, Primary Key)
- title (VARCHAR, Required) - Brief title of the lost/found item
- description (TEXT, Required) - Detailed description of the item
- location (VARCHAR, Required) - Where the item was lost or found
- user_id (UUID, Foreign Key) - References manual_users(id)
- status (VARCHAR, Default: 'lost') - Status: 'lost', 'found', or 'claimed'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
*/
