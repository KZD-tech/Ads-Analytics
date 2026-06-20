-- Campaign Groups (Kempen Teras) — hierarchical campaign grouping
-- Allows grouping sub-campaigns under a core campaign and rolling up metrics

-- ============================================================
-- ad_campaign_groups (Kempen Teras)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ad_campaign_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- Add group_id FK to ad_campaigns
-- ============================================================
ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.ad_campaign_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_group_id ON public.ad_campaigns(group_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.ad_campaign_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read ad_campaign_groups"
  ON public.ad_campaign_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can manage ad_campaign_groups"
  ON public.ad_campaign_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to update group_id on campaigns
CREATE POLICY "Authenticated can update ad_campaigns"
  ON public.ad_campaigns FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Allow authenticated users to insert campaign groups
CREATE POLICY "Authenticated can insert ad_campaign_groups"
  ON public.ad_campaign_groups FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can delete ad_campaign_groups"
  ON public.ad_campaign_groups FOR DELETE TO authenticated USING (true);