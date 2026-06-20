export type Platform = "meta" | "google";

export type CampaignStatus = "active" | "paused" | "archived";

export type CampaignObjective =
  | "awareness"
  | "traffic"
  | "conversion"
  | "leads";

export type SyncStatus = "success" | "failed" | "partial";

export interface AdPlatform {
  id: string;
  name: Platform;
  created_at: string;
}

export interface AdCampaign {
  id: string;
  platform_id: string;
  campaign_id_external: string;
  campaign_name: string;
  status: CampaignStatus;
  objective: CampaignObjective;
  group_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdDailyMetric {
  id: string;
  campaign_id: string;
  report_date: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  conversions: number;
  revenue: number;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  roas: number | null;
  cpa: number | null;
  created_at: string;
}

export interface N8nSyncLog {
  id: string;
  platform: Platform;
  sync_date: string;
  status: SyncStatus;
  records_inserted: number;
  records_updated: number;
  error_message: string | null;
  synced_at: string;
}

export interface CampaignWithMetrics extends AdCampaign {
  platform_name?: Platform;
  metrics?: AdDailyMetric[];
}

export interface AggregatedMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  cpa: number;
}

export interface DailyAggregated {
  report_date: string;
  meta_spend: number;
  google_spend: number;
  meta_clicks: number;
  google_clicks: number;
  meta_conversions: number;
  google_conversions: number;
  meta_impressions: number;
  google_impressions: number;
  meta_revenue: number;
  google_revenue: number;
  meta_ctr: number;
  google_ctr: number;
  meta_roas: number;
  google_roas: number;
  total_spend: number;
  total_clicks: number;
  total_impressions: number;
  total_conversions: number;
  total_revenue: number;
  avg_ctr: number;
  avg_roas: number;
}

export interface Insight {
  type: "warning" | "positive" | "info" | "action";
  title: string;
  description: string;
  metric?: string;
  value?: string;
}

// Webhook payload from n8n
export interface N8nWebhookPayload {
  platform: Platform;
  report_date: string;
  campaigns: {
    campaign_id_external: string;
    campaign_name: string;
    status: CampaignStatus;
    objective: CampaignObjective;
    impressions: number;
    clicks: number;
    spend: number;
    reach: number;
    conversions: number;
    revenue: number;
  }[];
}

// ============================================================
// Campaign Groups (Kempen Teras)
// ============================================================
export interface AdCampaignGroup {
  id: string;
  group_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignGroupWithAggregates extends AdCampaignGroup {
  campaign_count: number;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  total_revenue: number;
  avg_ctr: number;
  avg_roas: number;
}

export interface CampaignGroupWithCampaigns extends AdCampaignGroup {
  campaigns: CampaignWithMetrics[];
}