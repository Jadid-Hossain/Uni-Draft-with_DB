-- Social Feed, Community Groups & News Updates Database Setup
-- This script creates all necessary tables and functions for the social networking features

-- 1. Create community_groups table for interest-based groups
CREATE TABLE IF NOT EXISTS public.community_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 1000,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- 2. Create group_memberships table
CREATE TABLE IF NOT EXISTS public.group_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  UNIQUE(group_id, user_id)
);

-- 3. Create social_posts table for the main feed
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.community_groups(id) ON DELETE SET NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  post_type VARCHAR(50) DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'link', 'announcement', 'event')),
  media_urls TEXT[], -- Array of media URLs
  external_link TEXT,
  is_announcement BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'group', 'club', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0
);

-- 4. Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 5. Create post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0
);

-- 6. Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 7. Create news_announcements table for official university announcements
CREATE TABLE IF NOT EXISTS public.news_announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  author_id UUID NOT NULL REFERENCES public.users(id),
  target_audience VARCHAR(100) DEFAULT 'all', -- 'all', 'students', 'faculty', 'staff', 'specific_department'
  departments TEXT[], -- Array of department IDs if target_audience is 'specific_department'
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  views_count INTEGER DEFAULT 0
);

-- 8. Create user_activity_log table for tracking student activities
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  activity_data JSONB, -- Flexible data storage for different activity types
  related_entity_type VARCHAR(50), -- 'post', 'comment', 'group', 'club', 'event'
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON public.social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_group_id ON public.social_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_club_id ON public.social_posts(club_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON public.social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_visibility ON public.social_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_social_posts_is_announcement ON public.social_posts(is_announcement);

CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON public.group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON public.group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_status ON public.group_memberships(status);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON public.post_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_news_announcements_category ON public.news_announcements(category);
CREATE INDEX IF NOT EXISTS idx_news_announcements_priority ON public.news_announcements(priority);
CREATE INDEX IF NOT EXISTS idx_news_announcements_published ON public.news_announcements(is_published, published_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON public.user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);

-- 10. RLS policies removed - not needed for this implementation
-- Tables will be accessible based on your existing authentication system

-- 11. Create triggers for updating counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'post_likes' THEN
      UPDATE public.social_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE public.social_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'post_likes' THEN
      UPDATE public.social_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE public.social_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- 12. Create function to get social feed
CREATE OR REPLACE FUNCTION get_social_feed(
  _user_id UUID,
  _limit INTEGER DEFAULT 20,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  group_id UUID,
  club_id UUID,
  content TEXT,
  post_type VARCHAR,
  media_urls TEXT[],
  external_link TEXT,
  is_announcement BOOLEAN,
  is_pinned BOOLEAN,
  visibility VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  likes_count INTEGER,
  comments_count INTEGER,
  shares_count INTEGER,
  author_name TEXT,
  author_avatar TEXT,
  author_department TEXT,
  group_name TEXT,
  club_name TEXT,
  is_liked BOOLEAN,
  is_author BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.user_id,
    sp.group_id,
    sp.club_id,
    sp.content,
    sp.post_type,
    sp.media_urls,
    sp.external_link,
    sp.is_announcement,
    sp.is_pinned,
    sp.visibility,
    sp.created_at,
    sp.updated_at,
    sp.likes_count,
    sp.comments_count,
    sp.shares_count,
    u.full_name as author_name,
    u.avatar_url as author_avatar,
    u.department as author_department,
    cg.name as group_name,
    c.name as club_name,
    CASE WHEN pl.id IS NOT NULL THEN true ELSE false END as is_liked,
    CASE WHEN sp.user_id = _user_id THEN true ELSE false END as is_author
  FROM public.social_posts sp
  JOIN public.users u ON sp.user_id = u.id
  LEFT JOIN public.community_groups cg ON sp.group_id = cg.id
  LEFT JOIN public.clubs c ON sp.club_id = c.id
  LEFT JOIN public.post_likes pl ON sp.id = pl.post_id AND pl.user_id = _user_id
  WHERE sp.visibility = 'public'
    OR (sp.visibility = 'group' AND EXISTS (
      SELECT 1 FROM public.group_memberships 
      WHERE group_id = sp.group_id AND user_id = _user_id AND status = 'active'
    ))
    OR (sp.visibility = 'club' AND EXISTS (
      SELECT 1 FROM public.club_memberships 
      WHERE club_id = sp.club_id AND user_id = _user_id AND status = 'active'
    ))
    OR sp.user_id = _user_id
  ORDER BY sp.is_pinned DESC, sp.created_at DESC
  LIMIT _limit OFFSET _offset;
END;
$$;

-- 13. Create function to get group posts
CREATE OR REPLACE FUNCTION get_group_posts(
  _group_id UUID,
  _user_id UUID,
  _limit INTEGER DEFAULT 20,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  post_type VARCHAR,
  media_urls TEXT[],
  external_link TEXT,
  is_announcement BOOLEAN,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  likes_count INTEGER,
  comments_count INTEGER,
  author_name TEXT,
  author_avatar TEXT,
  is_liked BOOLEAN,
  is_author BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.user_id,
    sp.content,
    sp.post_type,
    sp.media_urls,
    sp.external_link,
    sp.is_announcement,
    sp.is_pinned,
    sp.created_at,
    sp.updated_at,
    sp.likes_count,
    sp.comments_count,
    u.full_name as author_name,
    u.avatar_url as author_avatar,
    CASE WHEN pl.id IS NOT NULL THEN true ELSE false END as is_liked,
    CASE WHEN sp.user_id = _user_id THEN true ELSE false END as is_author
  FROM public.social_posts sp
  JOIN public.users u ON sp.user_id = u.id
  LEFT JOIN public.post_likes pl ON sp.id = pl.post_id AND pl.user_id = _user_id
  WHERE sp.group_id = _group_id
    AND (sp.visibility IN ('public', 'group') OR sp.user_id = _user_id)
  ORDER BY sp.is_pinned DESC, sp.created_at DESC
  LIMIT _limit OFFSET _offset;
END;
$$;

-- 14. Insert sample data for testing
INSERT INTO public.community_groups (name, description, category, created_by) VALUES
  ('Tech Enthusiasts', 'A group for technology lovers and innovators', 'Technology', (SELECT id FROM public.users LIMIT 1)),
  ('Book Club', 'Share and discuss your favorite books', 'Academic', (SELECT id FROM public.users LIMIT 1)),
  ('Fitness & Wellness', 'Stay healthy and motivated together', 'Health', (SELECT id FROM public.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- 15. Verify the setup
SELECT 'Social Feed Database Setup Complete!' as status;

-- Show created tables
SELECT 
  table_name,
  'Table' as object_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'community_groups', 'group_memberships', 'social_posts', 
    'post_likes', 'post_comments', 'comment_likes',
    'news_announcements', 'user_activity_log'
  )
ORDER BY table_name;

-- Show created functions
SELECT 
  routine_name,
  'Function' as object_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_social_feed', 'get_group_posts', 'update_post_counts')
ORDER BY routine_name;
