-- ============================================================
-- AGENTSCREENER - PIPELINE DATA TABLES
-- Run this AFTER the main schema
-- ============================================================

-- Pipeline data (latest snapshot per source per product)
CREATE TABLE IF NOT EXISTS public.pipeline_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  source TEXT NOT NULL, -- 'github', 'traffic', 'funding', 'jobs', 'social'
  data JSONB NOT NULL DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, source)
);

-- Uptime check history (append-only log)
CREATE TABLE IF NOT EXISTS public.uptime_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  status INTEGER,
  ok BOOLEAN,
  latency_ms INTEGER,
  error TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline run log
CREATE TABLE IF NOT EXISTS public.pipeline_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT,
  products_processed INTEGER,
  errors INTEGER DEFAULT 0,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_data_product ON public.pipeline_data(product_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_data_source ON public.pipeline_data(source);
CREATE INDEX IF NOT EXISTS idx_uptime_checks_product ON public.uptime_checks(product_id);
CREATE INDEX IF NOT EXISTS idx_uptime_checks_date ON public.uptime_checks(checked_at);

-- RLS
ALTER TABLE public.pipeline_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uptime_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;

-- Pipeline data is public read
CREATE POLICY "Pipeline data is public" ON public.pipeline_data FOR SELECT USING (true);
CREATE POLICY "Uptime checks are public" ON public.uptime_checks FOR SELECT USING (true);
CREATE POLICY "Pipeline runs are public" ON public.pipeline_runs FOR SELECT USING (true);
