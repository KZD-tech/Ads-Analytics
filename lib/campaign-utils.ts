import type { AdCampaign, AdDailyMetric, Platform } from "@/types/ads";
import { aggregateMetrics } from "@/lib/metrics";

export interface CampaignRow {
  campaign: AdCampaign;
  platform_name: Platform;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  roas: number;
  conversions: number;
}

export function buildCampaignRows(
  campaigns: (AdCampaign & { platform_name?: Platform; metrics?: AdDailyMetric[] })[],
): CampaignRow[] {
  return campaigns.map((c) => {
    const agg = aggregateMetrics(c.metrics || []);
    return {
      campaign: c,
      platform_name: c.platform_name || "meta",
      spend: agg.spend,
      impressions: agg.impressions,
      clicks: agg.clicks,
      ctr: agg.ctr,
      roas: agg.roas,
      conversions: agg.conversions,
    };
  });
}