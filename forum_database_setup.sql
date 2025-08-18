-- Forum Database Setup Script
-- This script creates the necessary tables for the forum functionality

-- Create forum_threads table
CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id UUID NOT NULL, -- Changed from author_id to user_id
    category VARCHAR(100) DEFAULT 'General Discussion',
    tags TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reply_at TIMESTAMP WITH TIME ZONE
);

-- Create forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    user_id UUID NOT NULL, -- Changed from author_id to user_id
    parent_post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_threads_user_id ON forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category);
CREATE INDEX IF NOT EXISTS idx_forum_threads_created_at ON forum_threads(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_threads_is_pinned ON forum_threads(is_pinned);

CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_id ON forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at);

-- Add Row Level Security (RLS) policies if needed
-- ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Sample data for testing (optional)
-- INSERT INTO forum_threads (title, content, user_id, category, tags) VALUES
-- ('Welcome to the Forum!', 'This is our first forum thread. Feel free to introduce yourself!', 'your-user-id-here', 'General Discussion', ARRAY['welcome', 'introduction']),
-- ('Study Tips for Finals', 'Share your best study strategies for upcoming finals week.', 'your-user-id-here', 'Academic', ARRAY['study', 'finals', 'tips']);

-- Comments explaining the schema:
/*
Forum Threads Table:
- id: Unique identifier for each thread
- title: Thread title (required)
- content: Thread content (required)
- user_id: ID of the user who created the thread (required)
- category: Thread category for organization
- tags: Array of tags for better searchability
- is_pinned: Whether thread is pinned to top
- is_locked: Whether thread is locked from replies
- view_count: Number of times thread was viewed
- reply_count: Number of replies in the thread
- created_at: When thread was created
- updated_at: When thread was last updated
- last_reply_at: When last reply was posted

Forum Posts Table:
- id: Unique identifier for each post
- thread_id: ID of the thread this post belongs to (required)
- content: Post content (required)
- user_id: ID of the user who created the post (required)
- parent_post_id: ID of parent post for nested replies (optional)
- is_edited: Whether post was edited
- edited_at: When post was last edited
- created_at: When post was created
- updated_at: When post was last updated

Key Changes Made:
1. Changed 'author_id' to 'user_id' to match your database schema
2. Added proper foreign key constraints
3. Added indexes for performance
4. Included sample data structure
*/
