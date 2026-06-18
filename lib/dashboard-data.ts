import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type {
  AdCampaign,
  AdDailyMetric,
  AdPlatform,
  DailyAggregated,
  N8nSyncLog,
  Platform,
} from "@/types/ads";
import { aggregateMetrics } from "@/lib/metrics";
import { subDays, format } from "date-fns";

export async function getServerSupabase() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Add them in Vercel → Settings → Environment Variables.",
    );
  }

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );
}

/**
 * Fetch all platforms.
 */
export async function getPlatforms(): Promise<AdPlatform[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("ad_platforms")
    .select("*")
    .order("name");
  if (error) {
    console.error("[data] getPlatforms:", error.message);
    return [];
  }
  return (data || []) as AdPlatform[];
}

/**
 * Get platform id → name map.
 */
export async function getPlatformMap(): Promise<Record<string, Platform>> {
  const platforms = await getPlatforms();
  const map: Record<string, Platform> = {};
  for (const p of platforms) {
    map[p.id] = p.name;
  }
  return map;
}

export interface CampaignWithMetrics extends AdCampaign {
  platform_name?: Platform;
  metrics: AdDailyMetric[];
}

/**
 * Fetch all campaigns with their daily metrics within a date range.
 */
export async function getCampaignsWithMetrics(
  fromDate: string,
  toDate: string,
  platformFilter?: Platform,
): Promise<CampaignWithMetrics[]> {
  const supabase = await getServerSupabase();
  const platformMap = await getPlatformMap();

  let campaignQuery = supabase.from("ad_campaigns").select("*");

  if (platformFilter) {
    // Find platform id for this platform name
    const platforms = await getPlatforms();
    const plat = platforms.find((p) => p.name === platformFilter);
    if (plat) {
      campaignQuery = campaignQuery.eq("platform_id", plat.id);
    }
  }

  const { data: campaigns, error } = await campaignQuery.order("campaign_name");
  if (error || !campaigns) {
    console.error("[data] getCampaigns:", error?.message);
    return [];
  }

  const result: CampaignWithMetrics[] = [];

  for (const c of campaigns as AdCampaign[]) {
    const { data: metrics, error: mErr } = await supabase
      .from("ad_daily_metrics")
      .select("*")
      .eq("campaign_id", c.id)
      .gte("report_date", fromDate)
      .lte("report_date", toDate)
      .order("report_date");

    if (mErr) {
      console.error("[data] getMetrics:", mErr.message);
    }

    result.push({
      ...c,
      platform_name: platformMap[c.platform_id],
      metrics: (metrics || []) as AdDailyMetric[],
    });
  }

  return result;
}

/**
 * Fetch a single campaign by id with all its metrics.
 */
export async function getCampaignDetail(
  campaignId: string,
  fromDate: string,
  toDate: string,
): Promise<CampaignWithMetrics | null> {
  const supabase = await getServerSupabase();
  const platformMap = await getPlatformMap();

  const { data: campaign, error } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (error || !campaign) {
    console.error("[data] getCampaignDetail:", error?.message);
    return null;
  }

  const { data: metrics } = await supabase
    .from("ad_daily_metrics")
    .select("*")
    .eq("campaign_id", campaignId)
    .gte("report_date", fromDate)
    .lte("report_date", toDate)
    .order("report_date");

  return {
    ...(campaign as AdCampaign),
    platform_name: platformMap[(campaign as AdCampaign).platform_id],
    metrics: (metrics || []) as AdDailyMetric[],
  };
}

/**
 * Aggregate daily metrics across campaigns, grouped by day and platform.
 */
export function aggregateDailyData(
  campaigns: CampaignWithMetrics[],
  fromDate: string,
  toDate: string,
): DailyAggregated[] {
  const days: DailyAggregated[] = [];

  const start = new Date(fromDate);
  const end = new Date(toDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = format(new Date(d), "yyyy-MM-dd");
    const dayData: DailyAggregated = {
      report_date: dateStr,
      meta_spend: 0,
      google_spend: 0,
      meta_clicks: 0,
      google_clicks: 0,
      meta_conversions: 0,
      google_conversions: 0,
      meta_impressions: 0,
      google_impressions: 0,
      meta_revenue: 0,
      google_revenue: 0,
      meta_ctr: 0,
      google_ctr: 0,
      meta_roas: 0,
      google_roas: 0,
      total_spend: 0,
      total_clicks: 0,
      total_impressions: 0,
      total_conversions: 0,
      total_revenue: 0,
      avg_ctr: 0,
      avg_roas: 0,
    };

    for (const c of campaigns) {
      const dayMetric = c.metrics.find(
        (m) => m.report_date === dateStr,
      );
      if (!dayMetric) continue;

      const platform = c.platform_name || "meta";
      const spend = Number(dayMetric.spend) || 0;
      const clicks = Number(dayMetric.clicks) || 0;
      const impressions = Number(dayMetric.impressions) || 0;
      const conversions = Number(dayMetric.conversions) || 0;
      const revenue = Number(dayMetric.revenue) || 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const roas = spend > 0 ? revenue / spend : 0;

      if (platform === "meta") {
        dayData.meta_spend += spend;
        dayData.meta_clicks += clicks;
        dayData.meta_conversions += conversions;
        dayData.meta_impressions += impressions;
        dayData.meta_revenue += revenue;
        dayData.meta_ctr += ctr;
        dayData.meta_roas += roas;
      } else {
        dayData.google_spend += spend;
        dayData.google_clicks += clicks;
        dayData.google_conversions += conversions;
        dayData.google_impressions += impressions;
        dayData.google_revenue += revenue;
        dayData.google_ctr += ctr;
        dayData.google_roas += roas;
      }

      dayData.total_spend += spend;
      dayData.total_clicks += clicks;
      dayData.total_impressions += impressions;
      dayData.total_conversions += conversions;
      dayData.total_revenue += revenue;
    }

    dayData.avg_ctr =
      dayData.total_impressions > 0
        ? (dayData.total_clicks / dayData.total_impressions) * 100
        : 0;
    dayData.avg_roas =
      dayData.total_spend > 0 ? dayData.total_revenue / dayData.total_spend : 0;

    days.push(dayData);
  }

  return days;
}

/**
 * Calculate overall aggregate for a set of campaigns.
 */
export function getCampaignAggregates(campaigns: CampaignWithMetrics[]) {
  const allMetrics = campaigns.flatMap((c) => c.metrics);
  return aggregateMetrics(allMetrics);
}

/**
 * Get the latest sync log entries.
 */
export async function getLastSync(): Promise<N8nSyncLog | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("n8n_sync_log")
    .select("*")
    .order("synced_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as N8nSyncLog;
}

/**
 * Get default date range: last N days from today.
 */
export function getDefaultDateRange(days = 30) {
  const to = new Date();
  const from = subDays(to, days - 1);
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  };
}

/**
 * Get date range N days ago (for comparison).
 */
export function getPreviousDateRange(days: number, refTo?: Date) {
  const to = refTo ? new Date(refTo) : new Date();
  const from = subDays(to, days * 2 - 1);
  const prevTo = subDays(to, days);
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(prevTo, "yyyy-MM-dd"),
  };
}