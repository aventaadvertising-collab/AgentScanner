-- ============================================================
-- SCREENER ALERTS + COLLECTIONS
-- Custom alert rules, notifications, and organized watchlists
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Discovery Alert Rules
CREATE TABLE IF NOT EXISTS public.discovery_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('keyword', 'category', 'source', 'specific')),
  match_value TEXT NOT NULL,
  metric TEXT NOT NULL CHECK (metric IN ('stars', 'downloads', 'forks', 'upvotes', 'stars_velocity', 'downloads_velocity')),
  operator TEXT NOT NULL CHECK (operator IN ('gt', 'lt', 'gte', 'lte')),
  threshold NUMERIC NOT NULL,
  time_window TEXT DEFAULT '24h' CHECK (time_window IN ('1h', '6h', '24h', '7d')),
  notify_in_app BOOLEAN DEFAULT TRUE,
  notify_email BOOLEAN DEFAULT FALSE,
  webhook_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Alert Notifications (in-app log)
CREATE TABLE IF NOT EXISTS public.alert_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_id UUID REFERENCES public.discovery_alerts(id) ON DELETE CASCADE NOT NULL,
  discovery_id UUID REFERENCES public.scanner_discoveries(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Collections (organized watchlists)
CREATE TABLE IF NOT EXISTS public.discovery_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#2DD4BF',
  icon TEXT DEFAULT '📁',
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Collection Items (many-to-many)
CREATE TABLE IF NOT EXISTS public.discovery_collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES public.discovery_collections(id) ON DELETE CASCADE NOT NULL,
  discovery_id UUID REFERENCES public.scanner_discoveries(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(collection_id, discovery_id)
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_da_user ON public.discovery_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_da_active ON public.discovery_alerts(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_an_user ON public.alert_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_an_unread ON public.alert_notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_dc_user ON public.discovery_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_dci_collection ON public.discovery_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_dci_discovery ON public.discovery_collection_items(discovery_id);

-- 6. RLS
ALTER TABLE public.discovery_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alerts" ON public.discovery_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notifications" ON public.alert_notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own collections" ON public.discovery_collections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own collection items" ON public.discovery_collection_items FOR ALL
  USING (collection_id IN (SELECT id FROM public.discovery_collections WHERE user_id = auth.uid()));

-- ============================================================
-- DONE
-- ============================================================
