import MetricCard from "@/components/dashboard/MetricCard";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import PlatformBreakdown from "@/components/dashboard/PlatformBreakdown";
import CampaignTable, { buildCampaignRows } from "@/components/dashboard/CampaignTable";
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
import {
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  TrendingUp,
} from "lucide-react";
import type { CampaignWithAggregated } from "@/lib/insights";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default async function OverviewClient({
  from,
  to,
  prevFrom,
  prevTo,
}: {
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
}) {
  try {
    // Fetch current + previous period data
    const [campaigns, prevCampaigns, lastSync] = await Promise.all([
      getCampaignsWithMetrics(from, to),
      getCampaignsWithMetrics(prevFrom, prevTo),
      getLastSync(),
    ]);

    console.log("[dashboard/overview] Data loaded:", {
      campaignsCount: campaigns.length,
      prevCampaignsCount: prevCampaigns.length,
      hasLastSync: !!lastSync,
    });

  const totals = getCampaignAggregates(campaigns);
  const prevTotals = getCampaignAggregates(prevCampaigns);
  const dailyData = aggregateDailyData(campaigns, from, to);

  // Build campaign rows for table
  const allRows = buildCampaignRows(campaigns);

  // Build insights
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

  // Platform breakdown
  const platformData = [
    {
      name: "Meta",
      value: dailyData.reduce((s, d) => s + d.meta_spend, 0),
      color: "#1877F2",
    },
    {
      name: "Google",
      value: dailyData.reduce((s, d) => s + d.google_spend, 0),
      color: "#EA4335",
    },
  ];

  const spendChange = percentChange(totals.spend, prevTotals.spend);
  const imprChange = percentChange(totals.impressions, prevTotals.impressions);
  const clicksChange = percentChange(totals.clicks, prevTotals.clicks);
  const convChange = percentChange(totals.conversions, prevTotals.conversions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Overview</h1>
          <p className="text-sm text-text-secondary">
            {from} → {to}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSync && <SyncStatusBadge sync={lastSync} />}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Spend"
          value={formatMYR(totals.spend)}
          change={spendChange ?? undefined}
          icon={<DollarSign size={20} />}
          accent="primary"
        />
        <MetricCard
          title="Total Impressions"
          value={formatNumber(totals.impressions)}
          change={imprChange ?? undefined}
          icon={<Eye size={20} />}
          accent="meta"
        />
        <MetricCard
          title="Total Clicks"
          value={formatNumber(totals.clicks)}
          subtitle={`Avg CTR: ${formatPercent(totals.ctr)}`}
          change={clicksChange ?? undefined}
          icon={<MousePointerClick size={20} />}
          accent="google"
        />
        <MetricCard
          title="Total Conversions"
          value={formatNumber(totals.conversions)}
          subtitle={`Avg ROAS: ${totals.roas.toFixed(2)}×`}
          change={convChange ?? undefined}
          icon={<Target size={20} />}
          accent="success"
        />
      </div>

      {/* Charts Row 1: Spend Over Time */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">
          Spend Over Time — Meta vs Google
        </h2>
        <PerformanceChart data={dailyData as unknown as Array<Record<string, string | number>>} type="spend" />
      </div>

      {/* Charts Row 2: CTR & ROAS Trend + Platform Split */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            CTR & ROAS Trend
          </h2>
          <PerformanceChart data={dailyData as unknown as Array<Record<string, string | number>>} type="ctr-roas" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            Platform Split (Spend)
          </h2>
          <PlatformBreakdown data={platformData} />
        </div>
      </div>

      {/* Top Performing Campaigns */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">
            Top Performing Campaigns
          </h2>
          <Link
            href="/dashboard/campaigns"
            className="text-xs text-primary hover:underline"
          >
            Lihat semua →
          </Link>
        </div>
        <CampaignTable rows={allRows} limit={5} sortable={false} />
      </div>

      {/* Insight Panel */}
      <InsightPanel insights={insights} />

      {/* Conversions chart */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">
          Conversions Over Time
        </h2>
        <PerformanceChart data={dailyData as unknown as Array<Record<string, string | number>>} type="conversions" />
      </div>
    </div>
  );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "";
    return (
      <div className="p-8">
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-danger mb-2">
            Debug: OverviewClient Error
          </h2>
          <p className="text-sm text-text-primary mb-4 font-mono break-all">{message}</p>
          {stack && (
            <details className="text-xs text-text-secondary">
              <summary className="cursor-pointer mb-2">Stack trace</summary>
              <pre className="whitespace-pre-wrap break-all text-xs">{stack}</pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}