-- ============================================================
-- DISCOVERY BOOKMARKS — Persistent auth-linked saves
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Bookmarks table (separate from votes — bookmarks are personal, votes are public)
CREATE TABLE IF NOT EXISTS public.discovery_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  discovery_id UUID REFERENCES public.scanner_discoveries(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, discovery_id)
);

-- 2. Add user_id column to discovery_votes (for migration)
ALTER TABLE public.discovery_votes
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.discovery_bookmarks ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies: users can SELECT/INSERT/DELETE their own bookmarks
CREATE POLICY "Users can read own bookmarks"
  ON public.discovery_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
  ON public.discovery_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.discovery_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.discovery_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_discovery ON public.discovery_bookmarks(discovery_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON public.discovery_votes(user_id);

-- ============================================================
-- DONE
-- ============================================================
