-- ============================================================
-- AGENTSCREENER - SCANNER TABLES
-- Real-time AI product discovery feed
-- Run this AFTER the main schema + pipeline tables
-- ============================================================

-- Scanner discoveries (append-only feed of detected AI projects)
CREATE TABLE IF NOT EXISTS public.scanner_discoveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identity
  external_id TEXT NOT NULL,
  source TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,

  -- Classification
  category TEXT,
  ai_keywords TEXT[] DEFAULT '{}',
  ai_confidence REAL DEFAULT 0,

  -- Early signals
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  language TEXT,

  -- Metadata
  author TEXT,
  author_url TEXT,
  topics TEXT[] DEFAULT '{}',
  license TEXT,

  -- Lifecycle
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  source_created_at TIMESTAMPTZ,
  promoted BOOLEAN DEFAULT FALSE,

  -- Dedup
  UNIQUE(source, external_id)
);

-- Scanner state (watermarks per source)
CREATE TABLE IF NOT EXISTS public.scanner_state (
  source TEXT PRIMARY KEY,
  last_scan_at TIMESTAMPTZ,
  last_event_id TEXT,
  items_found_total INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sd_discovered ON public.scanner_discoveries(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_sd_source ON public.scanner_discoveries(source);
CREATE INDEX IF NOT EXISTS idx_sd_category ON public.scanner_discoveries(category);

-- RLS
ALTER TABLE public.scanner_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scanner discoveries are public" ON public.scanner_discoveries FOR SELECT USING (true);
CREATE POLICY "Scanner state is public" ON public.scanner_state FOR SELECT USING (true);

-- Enable Supabase Realtime for live feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.scanner_discoveries;
ALTER TABLE public.scanner_discoveries REPLICA IDENTITY FULL;
