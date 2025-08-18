-- Simple Forum Database Setup
-- This creates minimal tables that match the current code

-- Create forum_threads table with only required columns
CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id BIGINT NOT NULL, -- Using BIGINT as per your schema
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum_posts table with only required columns
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    user_id BIGINT NOT NULL, -- Using BIGINT as per your schema
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_forum_threads_user_id ON forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_id ON forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);

-- Optional: Add additional columns later if needed
-- ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS category VARCHAR(100);
-- ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS tags TEXT[];
-- ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
-- ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;
-- ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
-- ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
-- ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS last_reply_at TIMESTAMP WITH TIME ZONE;

-- ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS parent_post_id UUID REFERENCES forum_posts(id);
-- ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
-- ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Sample data (replace user_id with actual bigint values from your users table)
-- INSERT INTO forum_threads (title, content, user_id) VALUES
-- ('Welcome to the Forum!', 'This is our first forum thread. Feel free to introduce yourself!', 12345),
-- ('Study Tips for Finals', 'Share your best study strategies for upcoming finals week.', 12345);

/*
Current Schema:
forum_threads:
- id (UUID, Primary Key)
- title (VARCHAR, Required)
- content (TEXT, Required)
- user_id (BIGINT, Required) - This expects a number, not UUID
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

forum_posts:
- id (UUID, Primary Key)
- thread_id (UUID, Foreign Key)
- content (TEXT, Required)
- user_id (BIGINT, Required) - This expects a number, not UUID
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Note: The user_id column expects BIGINT (numbers), not UUID strings.
You'll need to either:
1. Change your users table to use BIGINT IDs, or
2. Change forum tables to use UUID for user_id, or
3. Convert UUIDs to numbers in your application code (current approach)
*/
