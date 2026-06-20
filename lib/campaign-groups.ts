import { getServerSupabase, getPlatformMap, type CampaignWithMetrics } from "@/lib/dashboard-data";
import type {
  AdCampaignGroup,
  CampaignGroupWithAggregates,
  CampaignGroupWithCampaigns,
} from "@/types/ads";
import { aggregateMetrics } from "@/lib/metrics";

export async function getCampaignGroups(): Promise<AdCampaignGroup[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("ad_campaign_groups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[campaign-groups] getCampaignGroups:", error.message);
    return [];
  }
  return (data || []) as AdCampaignGroup[];
}

export async function getCampaignGroupsWithAggregates(
  fromDate: string,
  toDate: string,
): Promise<CampaignGroupWithAggregates[]> {
  const supabase = await getServerSupabase();
  const platformMap = await getPlatformMap();

  const { data: groups, error } = await supabase
    .from("ad_campaign_groups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !groups) {
    console.error("[campaign-groups] getCampaignGroupsWithAggregates:", error?.message);
    return [];
  }

  const result: CampaignGroupWithAggregates[] = [];

  for (const g of groups as AdCampaignGroup[]) {
    const { data: campaigns, error: cErr } = await supabase
      .from("ad_campaigns")
      .select("id")
      .eq("group_id", g.id);
    if (cErr) {
      console.error("[campaign-groups] campaigns for group:", cErr.message);
    }

    const campaignIds = (campaigns || []).map((c) => (c as any).id as string);
    const allMetrics = await fetchAllMetricsForCampaigns(
      supabase,
      campaignIds,
      fromDate,
      toDate,
    );
    const aggregated = aggregateMetrics(allMetrics);

    result.push({
      ...g,
      campaign_count: campaignIds.length,
      total_spend: aggregated.spend,
      total_impressions: aggregated.impressions,
      total_clicks: aggregated.clicks,
      total_conversions: aggregated.conversions,
      total_revenue: aggregated.revenue,
      avg_ctr: aggregated.ctr,
      avg_roas: aggregated.roas,
    });
  }

  return result;
}

async function fetchAllMetricsForCampaigns(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  campaignIds: string[],
  fromDate: string,
  toDate: string,
) {
  if (campaignIds.length === 0) return [];
  const { data: metrics, error } = await supabase
    .from("ad_daily_metrics")
    .select("*")
    .in("campaign_id", campaignIds)
    .gte("report_date", fromDate)
    .lte("report_date", toDate);
  if (error) {
    console.error("[campaign-groups] fetchAllMetrics:", error.message);
    return [];
  }
  return (metrics || []) as any[];
}

export async function getCampaignGroupDetail(
  groupId: string,
  fromDate: string,
  toDate: string,
): Promise<CampaignGroupWithCampaigns | null> {
  const supabase = await getServerSupabase();
  const platformMap = await getPlatformMap();

  const { data: group, error } = await supabase
    .from("ad_campaign_groups")
    .select("*")
    .eq("id", groupId)
    .single();
  if (error || !group) {
    console.error("[campaign-groups] getCampaignGroupDetail:", error?.message);
    return null;
  }

  const { data: campaigns, error: cErr } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("group_id", groupId)
    .order("campaign_name");
  if (cErr) {
    console.error("[campaign-groups] campaigns:", cErr.message);
    return { ...(group as AdCampaignGroup), campaigns: [] };
  }

  const campaignList = (campaigns || []) as any[];
  const result: CampaignWithMetrics[] = [];

  for (const c of campaignList) {
    const { data: metrics } = await supabase
      .from("ad_daily_metrics")
      .select("*")
      .eq("campaign_id", c.id)
      .gte("report_date", fromDate)
      .lte("report_date", toDate)
      .order("report_date");

    result.push({
      ...c,
      platform_name: platformMap[c.platform_id],
      metrics: (metrics || []) as any[],
    });
  }

  return {
    ...(group as AdCampaignGroup),
    campaigns: result,
  };
}

export async function getUngroupedCampaigns(
  fromDate: string,
  toDate: string,
): Promise<CampaignWithMetrics[]> {
  const supabase = await getServerSupabase();
  const platformMap = await getPlatformMap();

  const { data: campaigns, error } = await supabase
    .from("ad_campaigns")
    .select("*")
    .is("group_id", null)
    .order("campaign_name");
  if (error) {
    console.error("[campaign-groups] getUngroupedCampaigns:", error.message);
    return [];
  }

  const result: CampaignWithMetrics[] = [];
  for (const c of (campaigns || []) as any[]) {
    const { data: metrics } = await supabase
      .from("ad_daily_metrics")
      .select("*")
      .eq("campaign_id", c.id)
      .gte("report_date", fromDate)
      .lte("report_date", toDate)
      .order("report_date");

    result.push({
      ...c,
      platform_name: platformMap[c.platform_id],
      metrics: (metrics || []) as any[],
    });
  }

  return result;
}

export { getServerSupabase };