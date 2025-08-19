-- Fix Chat Tables Migration Script
-- This script adds missing columns to existing chat tables

-- First, let's check what columns currently exist
-- Run this to see current structure:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'conversations' AND table_schema = 'public';

-- 1. Add missing columns to conversations table
DO $$ 
BEGIN
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' 
                   AND column_name = 'created_by' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.conversations ADD COLUMN created_by UUID;
    END IF;
    
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' 
                   AND column_name = 'type' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.conversations ADD COLUMN type TEXT DEFAULT 'direct';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' 
                   AND column_name = 'updated_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.conversations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' 
                   AND column_name = 'is_active' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.conversations ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Add missing columns to conversation_participants table
DO $$ 
BEGIN
    -- Add joined_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversation_participants' 
                   AND column_name = 'joined_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.conversation_participants ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add is_admin column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversation_participants' 
                   AND column_name = 'is_admin' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.conversation_participants ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Add missing columns to messages table
DO $$ 
BEGIN
    -- Add message_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' 
                   AND column_name = 'message_type' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.messages ADD COLUMN message_type TEXT DEFAULT 'text';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' 
                   AND column_name = 'updated_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.messages ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add is_edited column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' 
                   AND column_name = 'is_edited' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.messages ADD COLUMN is_edited BOOLEAN DEFAULT false;
    END IF;
    
    -- Add is_deleted column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' 
                   AND column_name = 'is_deleted' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.messages ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. Add constraints and checks
DO $$ 
BEGIN
    -- Add type check constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'conversations_type_check' 
                   AND table_name = 'conversations') THEN
        ALTER TABLE public.conversations ADD CONSTRAINT conversations_type_check 
        CHECK (type IN ('direct', 'group'));
    END IF;
    
    -- Add message_type check constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'messages_message_type_check' 
                   AND table_name = 'messages') THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check 
        CHECK (message_type IN ('text', 'image', 'file', 'system'));
    END IF;
END $$;

-- 5. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_updated_at ON public.messages(updated_at);

-- 6. Create message_reactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);

-- 7. Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Conversation creators can update their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Conversation creators can delete their conversations" ON public.conversations;

DROP POLICY IF EXISTS "Users can view participants of conversations they're in" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add themselves to conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Conversation admins can manage participants" ON public.conversation_participants;

DROP POLICY IF EXISTS "Users can view messages in conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to conversations they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

DROP POLICY IF EXISTS "Users can view reactions to messages they can see" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can add reactions to messages they can see" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.message_reactions;

-- 9. Create RLS policies
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Conversation creators can update their conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Conversation creators can delete their conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view participants of conversations they're in" ON public.conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = conversation_id AND cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add themselves to conversations" ON public.conversation_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Conversation admins can manage participants" ON public.conversation_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id 
      AND cp.user_id = auth.uid() 
      AND cp.is_admin = true
    )
  );

CREATE POLICY "Users can view messages in conversations they participate in" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to conversations they participate in" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    ) AND auth.uid() = sender_id
  );

CREATE POLICY "Users can edit their own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);

CREATE POLICY "Users can view reactions to messages they can see" ON public.message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_reactions.message_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions to messages they can see" ON public.message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions" ON public.message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- 10. Create or replace functions for timestamp updates
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

-- 11. Create or replace triggers
DROP TRIGGER IF EXISTS trigger_update_conversations_updated_at ON public.conversations;
CREATE TRIGGER trigger_update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

DROP TRIGGER IF EXISTS trigger_update_messages_updated_at ON public.messages;
CREATE TRIGGER trigger_update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- 12. Create helper functions
CREATE OR REPLACE FUNCTION create_direct_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Check if conversation already exists
  SELECT c.id INTO conversation_id
  FROM public.conversations c
  JOIN public.conversation_participants cp1 ON c.id = cp1.conversation_id
  JOIN public.conversation_participants cp2 ON c.id = cp2.conversation_id
  WHERE c.type = 'direct'
    AND cp1.user_id = user1_id
    AND cp2.user_id = user2_id;
  
  IF conversation_id IS NULL THEN
    -- Create new conversation
    INSERT INTO public.conversations (name, type, created_by)
    VALUES ('Direct Chat', 'direct', user1_id)
    RETURNING id INTO conversation_id;
    
    -- Add both users as participants
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (conversation_id, user1_id), (conversation_id, user2_id);
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_group_conversation(conversation_name TEXT, creator_id UUID, participant_ids UUID[])
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  participant_id UUID;
BEGIN
  -- Create new conversation
  INSERT INTO public.conversations (name, type, created_by)
  VALUES (conversation_name, 'group', creator_id)
  RETURNING id INTO conversation_id;
  
  -- Add creator as admin participant
  INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin)
  VALUES (conversation_id, creator_id, true);
  
  -- Add other participants
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    IF participant_id != creator_id THEN
      INSERT INTO public.conversation_participants (conversation_id, user_id)
      VALUES (conversation_id, participant_id);
    END IF;
  END LOOP;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Verification queries
-- Check final table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('conversations', 'conversation_participants', 'messages', 'message_reactions')
ORDER BY table_name, ordinal_position;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'conversation_participants', 'messages', 'message_reactions');

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('conversations', 'conversation_participants', 'messages', 'message_reactions');
