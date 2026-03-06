-- ============================================================
-- AGENTSCREENER - COMMIT ACTIVITY CACHE
-- Caches GitHub commit activity data for scanner discoveries
-- Run this AFTER scanner tables are set up
-- ============================================================

CREATE TABLE IF NOT EXISTS public.commit_activity_cache (
  repo_path TEXT PRIMARY KEY,          -- "owner/repo" format
  data JSONB NOT NULL,                 -- { weeks: [{ w, t, d }, ...] }
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for TTL-based cache invalidation queries
CREATE INDEX IF NOT EXISTS idx_cac_fetched ON public.commit_activity_cache(fetched_at);

-- RLS
ALTER TABLE public.commit_activity_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Commit activity cache is public" ON public.commit_activity_cache FOR SELECT USING (true);
