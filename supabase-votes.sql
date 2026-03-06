-- ============================================================
-- DISCOVERY VOTES — Anonymous upvoting for scanner_discoveries
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Votes table
CREATE TABLE IF NOT EXISTS public.discovery_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id TEXT NOT NULL,
  discovery_id UUID REFERENCES public.scanner_discoveries(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voter_id, discovery_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_dv_voter ON public.discovery_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_dv_discovery ON public.discovery_votes(discovery_id);

-- RLS: public read, anyone can insert/delete their own votes
ALTER TABLE public.discovery_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are publicly readable"
  ON public.discovery_votes FOR SELECT USING (true);

CREATE POLICY "Anyone can vote"
  ON public.discovery_votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Voters can remove own vote"
  ON public.discovery_votes FOR DELETE USING (true);

-- Trigger function: auto-update the denormalized upvotes count
-- on scanner_discoveries when votes are added/removed
CREATE OR REPLACE FUNCTION public.update_discovery_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.scanner_discoveries
    SET upvotes = COALESCE(upvotes, 0) + 1
    WHERE id = NEW.discovery_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.scanner_discoveries
    SET upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0)
    WHERE id = OLD.discovery_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wire up the trigger
DROP TRIGGER IF EXISTS on_discovery_vote_change ON public.discovery_votes;
CREATE TRIGGER on_discovery_vote_change
  AFTER INSERT OR DELETE ON public.discovery_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_discovery_vote_count();
