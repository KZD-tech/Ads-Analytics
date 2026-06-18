-- Ad Analytics Dashboard — Initial Migration
-- Tables: ad_platforms, ad_campaigns, ad_daily_metrics, n8n_sync_log
-- RLS enabled on all tables; authenticated users can SELECT

-- ============================================================
-- ad_platforms
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ad_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- 'meta' | 'google'
  created_at timestamptz DEFAULT now()
);

INSERT INTO public.ad_platforms (name) VALUES ('meta'), ('google')
  ON CONFLICT DO NOTHING;

-- ============================================================
-- ad_campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id uuid REFERENCES public.ad_platforms(id) ON DELETE CASCADE,
  campaign_id_external text NOT NULL,
  campaign_name text NOT NULL,
  status text DEFAULT 'active', -- 'active' | 'paused' | 'archived'
  objective text,              -- 'awareness' | 'traffic' | 'conversion' | 'leads'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_platform_id ON public.ad_campaigns(platform_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_campaigns_external_unique
  ON public.ad_campaigns(campaign_id_external);

-- ============================================================
-- ad_daily_metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ad_daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  spend numeric(12,2) DEFAULT 0,
  reach bigint DEFAULT 0,
  conversions bigint DEFAULT 0,
  revenue numeric(12,2) DEFAULT 0,
  ctr numeric(8,4),
  cpc numeric(10,4),
  cpm numeric(10,4),
  roas numeric(10,4),
  cpa numeric(10,4),
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_ad_daily_metrics_campaign_id ON public.ad_daily_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_daily_metrics_report_date ON public.ad_daily_metrics(report_date);

-- ============================================================
-- n8n_sync_log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.n8n_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  sync_date date NOT NULL,
  status text, -- 'success' | 'failed' | 'partial'
  records_inserted integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  error_message text,
  synced_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_n8n_sync_log_platform ON public.n8n_sync_log(platform);
CREATE INDEX IF NOT EXISTS idx_n8n_sync_log_synced_at ON public.n8n_sync_log(synced_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.ad_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_sync_log ENABLE ROW LEVEL SECURITY;

-- SELECT policies (authenticated users only)
CREATE POLICY "Authenticated can read ad_platforms"
  ON public.ad_platforms FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read ad_campaigns"
  ON public.ad_campaigns FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read ad_daily_metrics"
  ON public.ad_daily_metrics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read n8n_sync_log"
  ON public.n8n_sync_log FOR SELECT TO authenticated USING (true);

-- NOTE: INSERT/UPDATE operations are performed by the service role
-- (via the n8n webhook endpoint and seed script). The service role
-- bypasses RLS, so no INSERT/UPDATE policies are needed here.