import type { AdDailyMetric, AggregatedMetrics } from "@/types/ads";

/**
 * Calculate derived metrics from raw values.
 * All formulas follow the spec:
 * - CTR = (clicks / impressions) * 100
 * - CPC = spend / clicks
 * - CPM = (spend / impressions) * 1000
 * - ROAS = revenue / spend
 * - CPA = spend / conversions
 */
export function calculateMetrics(
  impressions: number,
  clicks: number,
  spend: number,
  conversions: number,
  revenue: number,
): {
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  roas: number | null;
  cpa: number | null;
} {
  return {
    ctr: impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(4)) : null,
    cpc: clicks > 0 ? Number((spend / clicks).toFixed(4)) : null,
    cpm: impressions > 0 ? Number(((spend / impressions) * 1000).toFixed(4)) : null,
    roas: spend > 0 ? Number((revenue / spend).toFixed(4)) : null,
    cpa: conversions > 0 ? Number((spend / conversions).toFixed(4)) : null,
  };
}

/**
 * Aggregate an array of daily metrics into a single summary.
 */
export function aggregateMetrics(metrics: AdDailyMetric[]): AggregatedMetrics {
  const totals = metrics.reduce(
    (acc, m) => {
      acc.impressions += Number(m.impressions) || 0;
      acc.clicks += Number(m.clicks) || 0;
      acc.spend += Number(m.spend) || 0;
      acc.reach += Number(m.reach) || 0;
      acc.conversions += Number(m.conversions) || 0;
      acc.revenue += Number(m.revenue) || 0;
      return acc;
    },
    {
      impressions: 0,
      clicks: 0,
      spend: 0,
      reach: 0,
      conversions: 0,
      revenue: 0,
    },
  );

  const derived = calculateMetrics(
    totals.impressions,
    totals.clicks,
    totals.spend,
    totals.conversions,
    totals.revenue,
  );

  return {
    ...totals,
    ctr: derived.ctr ?? 0,
    cpc: derived.cpc ?? 0,
    cpm: derived.cpm ?? 0,
    roas: derived.roas ?? 0,
    cpa: derived.cpa ?? 0,
  };
}

/**
 * Format a number as MYR (RM).
 */
export function formatMYR(value: number, decimals = 2): string {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
}

/**
 * Format a number with thousands separators.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

/**
 * Format a percentage value (value already in %, e.g. 2.5 = 2.5%).
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${(value || 0).toFixed(decimals)}%`;
}

/**
 * Format a date as DD/MM/YYYY for display.
 * Input: ISO date string (YYYY-MM-DD or ISO timestamp)
 */
export function formatDateDMY(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a datetime string (ISO) as DD/MM/YYYY HH:mm.
 */
export function formatDateTimeDMY(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Calculate percentage change between two values.
 * Returns null if the previous value is 0 or undefined.
 */
export function percentChange(current: number, previous: number): number | null {
  if (!previous || previous === 0) return null;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}