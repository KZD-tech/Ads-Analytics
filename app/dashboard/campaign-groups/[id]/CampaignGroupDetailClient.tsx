"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, Eye, MousePointerClick, Target } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import CampaignTable from "@/components/dashboard/CampaignTable";
import { buildCampaignRows } from "@/lib/campaign-utils";
import {
  DeleteGroupButton,
  AddCampaignToGroup,
} from "@/components/dashboard/CampaignGroupManager";
import { aggregateMetrics, formatMYR, formatNumber, formatPercent } from "@/lib/metrics";
import type { CampaignGroupWithCampaigns } from "@/types/ads";

export default function CampaignGroupDetailClient({
  group,
  from,
  to,
  ungroupedCampaigns,
}: {
  group: CampaignGroupWithCampaigns;
  from: string;
  to: string;
  ungroupedCampaigns: { id: string; campaign_name: string; campaign_id_external: string }[];
}) {
  const allMetrics = group.campaigns.flatMap((c) => c.metrics || []);
  const agg = aggregateMetrics(allMetrics as any[]);

  const rows = buildCampaignRows(group.campaigns);

  const chartData: { report_date: string; Spend: number; Clicks: number; Impressions: number }[] = [];
  const dateMap: Record<string, { Spend: number; Clicks: number; Impressions: number }> = {};
  for (const c of group.campaigns) {
    for (const m of c.metrics || []) {
      if (!dateMap[m.report_date]) {
        dateMap[m.report_date] = { Spend: 0, Clicks: 0, Impressions: 0 };
      }
      dateMap[m.report_date].Spend += Number(m.spend) || 0;
      dateMap[m.report_date].Clicks += Number(m.clicks) || 0;
      dateMap[m.report_date].Impressions += Number(m.impressions) || 0;
    }
  }
  for (const [date, vals] of Object.entries(dateMap)) {
    chartData.push({ report_date: date, ...vals });
  }
  chartData.sort((a, b) => a.report_date.localeCompare(b.report_date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/campaign-groups"
          className="mb-2 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={14} /> Kempen Teras
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-text-primary">{group.group_name}</h1>
            {group.description && (
              <p className="text-sm text-text-secondary">{group.description}</p>
            )}
            <p className="mt-1 text-xs text-text-secondary">
              {from} → {to} · {group.campaigns.length} sub-kempen
            </p>
          </div>
          <DeleteGroupButton groupId={group.id} groupName={group.group_name} />
        </div>
      </div>

      {/* Summary MetricCards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Spend"
          value={formatMYR(agg.spend)}
          icon={<DollarSign size={20} />}
          accent="primary"
        />
        <MetricCard
          title="Total Impressions"
          value={formatNumber(agg.impressions)}
          icon={<Eye size={20} />}
          accent="meta"
        />
        <MetricCard
          title="Total Clicks"
          value={formatNumber(agg.clicks)}
          subtitle={`CTR: ${formatPercent(agg.ctr)}`}
          icon={<MousePointerClick size={20} />}
          accent="google"
        />
        <MetricCard
          title="Total Conversions"
          value={formatNumber(agg.conversions)}
          subtitle={`ROAS: ${agg.roas.toFixed(2)}×`}
          icon={<Target size={20} />}
          accent="success"
        />
      </div>

      {/* Daily Performance Chart */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">
          Daily Performance
        </h2>
        <PerformanceChart data={chartData} type="custom" height={300} />
      </div>

      {/* Sub-campaigns Table + Add Campaign */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Sub Kempen</h2>
        </div>
        <AddCampaignToGroup groupId={group.id} ungroupedCampaigns={ungroupedCampaigns} />
        <CampaignTable rows={rows} />
      </div>
    </div>
  );
}