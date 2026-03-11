-- ============================================================
-- DISCOVERY SNAPSHOTS — Historical metrics for sparklines & growth indicators
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Snapshots table — stores periodic metric snapshots per discovery
CREATE TABLE IF NOT EXISTS public.discovery_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discovery_id UUID REFERENCES public.scanner_discoveries(id) ON DELETE CASCADE NOT NULL,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
-- Composite index for common query: "get snapshots for discovery X, ordered by time"
CREATE INDEX IF NOT EXISTS idx_ds_discovery_at ON public.discovery_snapshots(discovery_id, snapshot_at DESC);
-- For cleanup queries
CREATE INDEX IF NOT EXISTS idx_ds_snapshot_at ON public.discovery_snapshots(snapshot_at DESC);

-- 3. RLS — snapshots are public read-only (no client writes)
ALTER TABLE public.discovery_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Snapshots are public" ON public.discovery_snapshots FOR SELECT USING (true);

-- 4. Cleanup function — delete snapshots older than 90 days
-- Run manually or via pg_cron: SELECT cleanup_old_snapshots();
CREATE OR REPLACE FUNCTION public.cleanup_old_snapshots()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.discovery_snapshots
  WHERE snapshot_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- DONE
-- ============================================================
