import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampaignDetail, getDefaultDateRange, getCampaignsWithMetrics } from "@/lib/dashboard-data";
import { aggregateMetrics, formatMYR, formatNumber, formatPercent, formatDateDMY } from "@/lib/metrics";
import MetricCard from "@/components/dashboard/MetricCard";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import { DollarSign, Eye, MousePointerClick, Target, ArrowLeft, TrendingUp } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import clsx from "clsx";

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string; to?: string };
}) {
  const { id } = params;
  const defaultRange = getDefaultDateRange(30);
  const from = searchParams.from || defaultRange.from;
  const to = searchParams.to || defaultRange.to;

  const campaign = await getCampaignDetail(id, from, to);

  if (!campaign) {
    notFound();
  }

  const agg = aggregateMetrics(campaign.metrics);

  // Build chart data: daily spend, clicks, impressions
  const chartData = campaign.metrics.map((m) => ({
    report_date: m.report_date,
    Spend: Number(m.spend) || 0,
    Clicks: Number(m.clicks) || 0,
    Impressions: Number(m.impressions) || 0,
  }));

  // Weekly breakdown
  const weeklyData: { week: string; spend: number; clicks: number; conversions: number; roas: number }[] = [];
  const weekMap: Record<string, { spend: number; clicks: number; conversions: number; revenue: number }> = {};

  for (const m of campaign.metrics) {
    const d = new Date(m.report_date);
    const wkStart = startOfWeek(d, { weekStartsOn: 1 });
    const wkEnd = endOfWeek(d, { weekStartsOn: 1 });
    const key = `${format(wkStart, "dd/MM")} - ${format(wkEnd, "dd/MM")}`;
    if (!weekMap[key]) {
      weekMap[key] = { spend: 0, clicks: 0, conversions: 0, revenue: 0 };
    }
    weekMap[key].spend += Number(m.spend) || 0;
    weekMap[key].clicks += Number(m.clicks) || 0;
    weekMap[key].conversions += Number(m.conversions) || 0;
    weekMap[key].revenue += Number(m.revenue) || 0;
  }

  for (const [week, vals] of Object.entries(weekMap)) {
    weeklyData.push({
      week,
      spend: vals.spend,
      clicks: vals.clicks,
      conversions: vals.conversions,
      roas: vals.spend > 0 ? vals.revenue / vals.spend : 0,
    });
  }

  // Compare with average of all campaigns
  const allCampaigns = await getCampaignsWithMetrics(from, to);
  const allAgg = aggregateMetrics(allCampaigns.flatMap((c) => c.metrics));

  const platformColor = campaign.platform_name === "meta" ? "text-meta" : "text-google";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/campaigns"
          className="mb-2 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={14} /> Kempen
        </Link>
        <h1 className="text-xl font-bold text-text-primary">
          {campaign.campaign_name}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          <span
            className={clsx(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
              campaign.platform_name === "meta"
                ? "bg-meta/15 text-meta"
                : "bg-google/15 text-google",
            )}
          >
            {campaign.platform_name === "meta" ? "Meta" : "Google"}
          </span>
          <span className="text-xs capitalize text-text-secondary">
            {campaign.objective}
          </span>
          <span
            className={clsx(
              "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
              campaign.status === "active"
                ? "bg-success/15 text-success"
                : "bg-border text-text-secondary",
            )}
          >
            {campaign.status}
          </span>
          <span className="text-xs text-text-secondary">
            {formatDateDMY(from)} → {formatDateDMY(to)}
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Spend"
          value={formatMYR(agg.spend)}
          icon={<DollarSign size={20} />}
          accent="primary"
        />
        <MetricCard
          title="Impressions"
          value={formatNumber(agg.impressions)}
          icon={<Eye size={20} />}
          accent="meta"
        />
        <MetricCard
          title="Clicks"
          value={formatNumber(agg.clicks)}
          subtitle={`CTR: ${formatPercent(agg.ctr)}`}
          icon={<MousePointerClick size={20} />}
          accent="google"
        />
        <MetricCard
          title="Conversions"
          value={formatNumber(agg.conversions)}
          subtitle={`ROAS: ${agg.roas.toFixed(2)}×`}
          icon={<Target size={20} />}
          accent="success"
        />
      </div>

      {/* Daily Chart */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">
          Daily Performance (30 Hari)
        </h2>
        <PerformanceChart data={chartData} type="custom" height={300} />
      </div>

      {/* Weekly Breakdown + Comparison */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Weekly Breakdown */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            Performance by Week
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-text-secondary">Week</th>
                  <th className="px-3 py-2 text-right text-xs text-text-secondary">Spend</th>
                  <th className="px-3 py-2 text-right text-xs text-text-secondary">Clicks</th>
                  <th className="px-3 py-2 text-right text-xs text-text-secondary">Conv.</th>
                  <th className="px-3 py-2 text-right text-xs text-text-secondary">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {weeklyData.map((w, i) => (
                  <tr key={i} className="hover:bg-border/30">
                    <td className="px-3 py-2 text-sm text-text-primary">{w.week}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-sm">{formatMYR(w.spend)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-sm text-text-secondary">{formatNumber(w.clicks)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-sm text-text-secondary">{formatNumber(w.conversions)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-sm">
                      <span className={w.roas >= 3 ? "text-success" : w.roas < 1.5 ? "text-danger" : ""}>
                        {w.roas > 0 ? `${w.roas.toFixed(2)}×` : "-"}
                      </span>
                    </td>
                  </tr>
                ))}
                {weeklyData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-sm text-text-secondary">
                      Tiada data mingguan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comparison vs Average */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            vs Purata Semua Kempen
          </h2>
          <div className="space-y-4">
            <ComparisonBar
              label="Spend"
              current={agg.spend}
              avg={allAgg.spend / Math.max(allCampaigns.length, 1)}
              format={formatMYR}
            />
            <ComparisonBar
              label="CTR"
              current={agg.ctr}
              avg={allAgg.ctr}
              format={(v) => formatPercent(v)}
            />
            <ComparisonBar
              label="ROAS"
              current={agg.roas}
              avg={allAgg.roas}
              format={(v) => `${v.toFixed(2)}×`}
            />
            <ComparisonBar
              label="Conversions"
              current={agg.conversions}
              avg={allAgg.conversions / Math.max(allCampaigns.length, 1)}
              format={formatNumber}
            />
            <ComparisonBar
              label="CPC"
              current={agg.cpc}
              avg={allAgg.cpc}
              format={(v) => formatMYR(v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonBar({
  label,
  current,
  avg,
  format,
}: {
  label: string;
  current: number;
  avg: number;
  format: (v: number) => string;
}) {
  const diff = avg > 0 ? ((current - avg) / avg) * 100 : 0;
  const isBetter = diff > 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="tabular-nums text-text-primary">
          {format(current)}{" "}
          <span className={isBetter ? "text-success" : "text-danger"}>
            ({isBetter ? "+" : ""}{diff.toFixed(0)}%)
          </span>
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-bg">
        <div
          className={clsx(
            "h-2 rounded-full",
            isBetter ? "bg-success" : "bg-danger",
          )}
          style={{
            width: `${Math.min(Math.abs(diff), 100)}%`,
            marginLeft: isBetter ? "50%" : undefined,
            marginRight: !isBetter ? "50%" : undefined,
          }}
        />
        <div className="absolute left-1/2 top-0 h-2 w-px bg-text-secondary" />
      </div>
      <div className="mt-0.5 text-[10px] text-text-secondary">
        Purata: {format(avg)}
      </div>
    </div>
  );
}