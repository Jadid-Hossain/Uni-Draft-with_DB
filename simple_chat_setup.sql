-- Simple Chat Setup - No Foreign Key Constraints
-- This creates chat tables that work independently of your users table

-- 1. Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS public.message_reactions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- 2. Create conversations table (no foreign key to users)
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  created_by TEXT NOT NULL, -- Store as TEXT instead of UUID to avoid FK constraints
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 3. Create conversation participants table (no foreign key to users)
CREATE TABLE public.conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Store as TEXT instead of UUID
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT false,
  UNIQUE(conversation_id, user_id)
);

-- 4. Create messages table (no foreign key to users)
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL, -- Store as TEXT instead of UUID
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false
);

-- 5. Create indexes for performance
CREATE INDEX idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at);
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- 6. Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE RLS;
ALTER TABLE public.messages ENABLE RLS;

-- 7. Create simple RLS policies (allow all operations for now)
CREATE POLICY "Allow all operations on conversations" ON public.conversations
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on participants" ON public.conversation_participants
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on messages" ON public.messages
  FOR ALL USING (true);

-- 8. Create functions for timestamp updates
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create triggers
CREATE TRIGGER trigger_update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

CREATE TRIGGER trigger_update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- 10. Create test data
INSERT INTO public.conversations (name, type, created_by) 
VALUES ('Welcome Chat', 'direct', 'test-user')
RETURNING id;

-- 11. Verify the setup
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('conversations', 'conversation_participants', 'messages')
ORDER BY table_name, ordinal_position;

-- 12. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'conversation_participants', 'messages');

-- 13. Test insert
INSERT INTO public.messages (conversation_id, sender_id, sender_name, content) 
VALUES (
  (SELECT id FROM public.conversations LIMIT 1),
  'test-user',
  'System',
  'Welcome to the chat! Start typing to send messages.'
) RETURNING *;
