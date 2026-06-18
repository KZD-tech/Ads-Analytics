import MetricCard from "@/components/dashboard/MetricCard";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import PlatformBreakdown from "@/components/dashboard/PlatformBreakdown";
import CampaignTable from "@/components/dashboard/CampaignTable";
import { buildCampaignRows } from "@/lib/campaign-utils";
import InsightPanel from "@/components/dashboard/InsightPanel";
import SyncStatusBadge from "@/components/dashboard/SyncStatusBadge";
import {
  getCampaignsWithMetrics,
  getCampaignAggregates,
  aggregateDailyData,
  getLastSync,
} from "@/lib/dashboard-data";
import { generateInsights } from "@/lib/insights";
import { aggregateMetrics, formatMYR, formatNumber, formatPercent, percentChange } from "@/lib/metrics";
import { DollarSign, Eye, MousePointerClick, Target } from "lucide-react";
import type { Platform } from "@/types/ads";
import type { CampaignWithAggregated } from "@/lib/insights";
import { subDays, format } from "date-fns";

export default async function PlatformPage({
  platform,
  from,
  to,
}: {
  platform: Platform;
  from: string;
  to: string;
}) {
  const prevFrom = format(subDays(new Date(from), 7), "yyyy-MM-dd");
  const prevTo = format(subDays(new Date(from), 1), "yyyy-MM-dd");

  const [campaigns, prevCampaigns, lastSync] = await Promise.all([
    getCampaignsWithMetrics(from, to, platform),
    getCampaignsWithMetrics(prevFrom, prevTo, platform),
    getLastSync(),
  ]);

  const totals = getCampaignAggregates(campaigns);
  const prevTotals = getCampaignAggregates(prevCampaigns);
  const dailyData = aggregateDailyData(campaigns, from, to);

  const platformSpend =
    platform === "meta"
      ? dailyData.reduce((s, d) => s + d.meta_spend, 0)
      : dailyData.reduce((s, d) => s + d.google_spend, 0);
  const platformClicks =
    platform === "meta"
      ? dailyData.reduce((s, d) => s + d.meta_clicks, 0)
      : dailyData.reduce((s, d) => s + d.google_clicks, 0);
  const platformConversions =
    platform === "meta"
      ? dailyData.reduce((s, d) => s + d.meta_conversions, 0)
      : dailyData.reduce((s, d) => s + d.google_conversions, 0);

  const allRows = buildCampaignRows(campaigns);

  const insightCampaigns: CampaignWithAggregated[] = campaigns.map((c) => {
    const agg = aggregateMetrics(c.metrics);
    return {
      ...c,
      total_spend: agg.spend,
      total_conversions: agg.conversions,
      total_revenue: agg.revenue,
      avg_ctr: agg.ctr,
      avg_roas: agg.roas,
      metrics: c.metrics,
    };
  });
  const insights = generateInsights(insightCampaigns);

  const platformColor = platform === "meta" ? "#1877F2" : "#EA4335";
  const accentColor = platform === "meta" ? "meta" : "google";

  // Build chart data for this platform
  const platformDailyData = dailyData.map((d) => ({
    report_date: d.report_date,
    Spend: platform === "meta" ? d.meta_spend : d.google_spend,
    Clicks: platform === "meta" ? d.meta_clicks : d.google_clicks,
    Conversions:
      platform === "meta" ? d.meta_conversions : d.google_conversions,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold capitalize text-text-primary">
            {platform === "meta" ? "Meta Ads" : "Google Ads"}
          </h1>
          <p className="text-sm text-text-secondary">
            {from} → {to}
          </p>
        </div>
        {lastSync && <SyncStatusBadge sync={lastSync} />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Spend"
          value={formatMYR(totals.spend)}
          change={percentChange(totals.spend, prevTotals.spend) ?? undefined}
          icon={<DollarSign size={20} />}
          accent={accentColor}
        />
        <MetricCard
          title="Impressions"
          value={formatNumber(totals.impressions)}
          change={percentChange(totals.impressions, prevTotals.impressions) ?? undefined}
          icon={<Eye size={20} />}
          accent={accentColor}
        />
        <MetricCard
          title="Clicks"
          value={formatNumber(totals.clicks)}
          subtitle={`CTR: ${formatPercent(totals.ctr)}`}
          change={percentChange(totals.clicks, prevTotals.clicks) ?? undefined}
          icon={<MousePointerClick size={20} />}
          accent={accentColor}
        />
        <MetricCard
          title="Conversions"
          value={formatNumber(totals.conversions)}
          subtitle={`ROAS: ${totals.roas.toFixed(2)}×`}
          change={percentChange(totals.conversions, prevTotals.conversions) ?? undefined}
          icon={<Target size={20} />}
          accent="success"
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">
          Spend & Clicks — 30 Hari
        </h2>
        <PerformanceChart data={platformDailyData as unknown as Array<Record<string, string | number>>} type="custom" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">
          Conversions Trend
        </h2>
        <PerformanceChart data={platformDailyData as unknown as Array<Record<string, string | number>>} type="conversions" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text-primary">
          Kempen {platform === "meta" ? "Meta" : "Google"}
        </h2>
        <CampaignTable rows={allRows} showPlatform={false} />
      </div>

      <InsightPanel insights={insights} />
    </div>
  );
}