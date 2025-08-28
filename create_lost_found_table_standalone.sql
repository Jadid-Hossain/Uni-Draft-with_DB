-- Lost & Found Database Setup (Standalone Version)
-- This creates the lost_found_items table without depending on manual_users table

-- Create lost_found_items table
CREATE TABLE IF NOT EXISTS public.lost_found_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    user_id TEXT NOT NULL, -- Using TEXT instead of UUID reference
    user_name TEXT, -- Store user name directly
    user_email TEXT, -- Store user email directly
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

-- RLS Policies (simplified for standalone version)
CREATE POLICY "Users can view all lost and found items" ON public.lost_found_items
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own lost and found items" ON public.lost_found_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own lost and found items" ON public.lost_found_items
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own lost and found items" ON public.lost_found_items
    FOR DELETE USING (true);

-- Sample data
INSERT INTO public.lost_found_items (title, description, location, user_id, user_name, user_email) VALUES
('Lost Laptop', 'MacBook Pro 13-inch, silver color, with a sticker on the back', 'Library - 2nd floor', 'user123', 'John Doe', 'john@example.com'),
('Found Keys', 'Set of keys with a red keychain, found near the cafeteria', 'Cafeteria entrance', 'user456', 'Jane Smith', 'jane@example.com');

/*
Current Schema:
lost_found_items:
- id (UUID, Primary Key)
- title (VARCHAR, Required) - Brief title of the lost/found item
- description (TEXT, Required) - Detailed description of the item
- location (VARCHAR, Required) - Where the item was lost or found
- user_id (TEXT, Required) - User identifier (can be any string)
- user_name (TEXT) - User's full name
- user_email (TEXT) - User's email
- status (VARCHAR, Default: 'lost') - Status: 'lost', 'found', or 'claimed'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Note: This standalone version doesn't require the manual_users table.
You'll need to update the useLostFound hook to work with this schema.
*/
