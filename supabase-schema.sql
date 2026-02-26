-- ============================================================
-- AGENTSCREENER - SUPABASE DATABASE SCHEMA
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'product_owner', 'admin')),
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  logo TEXT,
  website TEXT,
  twitter TEXT,
  contact_email TEXT,
  contact_name TEXT,
  founded TEXT,
  age TEXT,
  
  -- Metrics (updated by data pipeline or self-reported)
  mrr BIGINT,
  mrr_change DECIMAL,
  mrr_hist JSONB DEFAULT '[]',
  mau BIGINT,
  mau_change DECIMAL,
  dau BIGINT,
  github_stars INTEGER,
  star_velocity INTEGER,
  team_size INTEGER,
  team_growth DECIMAL,
  funding_total BIGINT,
  last_round TEXT,
  valuation BIGINT,
  investors JSONB DEFAULT '[]',
  uptime DECIMAL,
  latency_ms INTEGER,
  error_rate DECIMAL,
  sentiment INTEGER,
  nps INTEGER,
  
  -- Verification sources
  verifications JSONB DEFAULT '{}',
  
  -- Sparkline data
  spark JSONB DEFAULT '[]',
  
  -- Status
  hot BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'claimed')),
  owner_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCT SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Product info
  name TEXT NOT NULL,
  ticker TEXT,
  website TEXT,
  category TEXT,
  description TEXT,
  founded TEXT,
  team_size INTEGER,
  last_round TEXT,
  funding_total BIGINT,
  
  -- Contact
  contact_name TEXT,
  contact_email TEXT,
  contact_role TEXT,
  
  -- Connected data sources
  connected_sources JSONB DEFAULT '{}',
  
  -- Self-reported metrics
  self_reported_mrr BIGINT,
  self_reported_mau BIGINT,
  
  -- Review
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WATCHLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 5. ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  metric TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below', 'changes')),
  threshold DECIMAL NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCT CLAIMS (product owners proving ownership)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  verification_method TEXT CHECK (verification_method IN ('dns', 'email', 'meta_tag', 'manual')),
  verification_token TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  UNIQUE(user_id, product_id)
);

-- 7. CONNECTED DATA SOURCES (OAuth tokens for verified data)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.connected_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT, -- encrypted in production
  refresh_token TEXT, -- encrypted in production
  scopes TEXT,
  last_synced TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_sources ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Products: everyone can read approved, owners can update their own
CREATE POLICY "Approved products are public" ON public.products FOR SELECT USING (status = 'approved');
CREATE POLICY "Product owners can update" ON public.products FOR UPDATE USING (auth.uid() = owner_id);

-- Submissions: users can create and read their own
CREATE POLICY "Users can create submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);

-- Watchlist: users manage their own
CREATE POLICY "Users can manage own watchlist" ON public.watchlist FOR ALL USING (auth.uid() = user_id);

-- Alerts: users manage their own
CREATE POLICY "Users can manage own alerts" ON public.alerts FOR ALL USING (auth.uid() = user_id);

-- Claims: users can create and read their own
CREATE POLICY "Users can create claims" ON public.product_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own claims" ON public.product_claims FOR SELECT USING (auth.uid() = user_id);

-- Connected sources: product owners only
CREATE POLICY "Product owners can manage sources" ON public.connected_sources FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_hot ON public.products(hot);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON public.watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(active);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

-- ============================================================
-- DONE
-- ============================================================
-- After running this:
-- 1. Go to Auth > Providers and enable Google, GitHub
-- 2. Set up OAuth credentials for each provider
-- 3. Add your site URL to Auth > URL Configuration
-- 4. Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
