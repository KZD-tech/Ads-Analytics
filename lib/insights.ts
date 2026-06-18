import type {
  AdCampaign,
  AdDailyMetric,
  AggregatedMetrics,
  Insight,
} from "@/types/ads";
import { aggregateMetrics, formatMYR, formatPercent } from "@/lib/metrics";

export interface CampaignWithAggregated extends AdCampaign {
  platform_name?: "meta" | "google";
  total_spend: number;
  total_conversions: number;
  total_revenue: number;
  avg_ctr: number;
  avg_roas: number;
  metrics: AdDailyMetric[];
}

interface WeeklyData {
  current: AggregatedMetrics;
  previous: AggregatedMetrics;
}

function getWeeklyData(
  metrics: AdDailyMetric[],
): WeeklyData | null {
  if (!metrics.length) return null;
  const sorted = [...metrics].sort(
    (a, b) => new Date(a.report_date).getTime() - new Date(b.report_date).getTime(),
  );
  const lastDate = new Date(sorted[sorted.length - 1].report_date);

  // Current week = last 7 days
  const sevenDaysAgo = new Date(lastDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const fourteenDaysAgo = new Date(lastDate);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const current = sorted.filter(
    (m) => new Date(m.report_date) >= sevenDaysAgo,
  );
  const previous = sorted.filter((m) => {
    const d = new Date(m.report_date);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  });

  return {
    current: aggregateMetrics(current),
    previous: aggregateMetrics(previous),
  };
}

/**
 * Generate rule-based insights from campaign data.
 *
 * Rules (per spec):
 * 1. ROAS < 1.5 → Warning: "ROAS rendah, kos melebihi hasil"
 * 2. ROAS > 3 → Positive: "Kempen X memberi pulangan tinggi"
 * 3. CTR < 1% → Warning: "CTR rendah, kreative perlu diperbaiki"
 * 4. Spend meningkat >20% dari minggu lepas → Info: "Perbelanjaan meningkat"
 * 5. Conversion rate drop >30% → Action: "Semak landing page"
 * 6. Kempen dengan spend tinggi tapi sifar conversion → Warning
 * 7. Best performing campaign → Positive highlight
 */
export function generateInsights(
  campaigns: CampaignWithAggregated[],
): Insight[] {
  const insights: Insight[] = [];
  if (!campaigns.length) return insights;

  // Sort by spend descending to identify high-spend campaigns
  const bySpend = [...campaigns].sort((a, b) => b.total_spend - a.total_spend);

  // Rule 1: ROAS < 1.5 for any campaign with meaningful spend
  for (const c of bySpend) {
    if (c.avg_roas > 0 && c.avg_roas < 1.5 && c.total_spend > 100) {
      insights.push({
        type: "warning",
        title: `ROAS rendah: ${c.campaign_name}`,
        description: `Kempen ini mempunyai ROAS ${c.avg_roas.toFixed(2)}×, bermakna kos melebihi hasil. Pertimbangkan untuk jeda atau optima semula.`,
        metric: "ROAS",
        value: `${c.avg_roas.toFixed(2)}×`,
      });
    }
  }

  // Rule 2: ROAS > 3 → Positive
  for (const c of bySpend) {
    if (c.avg_roas > 3 && c.total_spend > 50) {
      insights.push({
        type: "positive",
        title: `Pulangan tinggi: ${c.campaign_name}`,
        description: `Kempen ini memberi ROAS ${c.avg_roas.toFixed(2)}× — pulangan melebihi 3× perbelanjaan. Pertimbangkan menambah bajet.`,
        metric: "ROAS",
        value: `${c.avg_roas.toFixed(2)}×`,
      });
    }
  }

  // Rule 3: CTR < 1% → Warning (kreative perlu diperbaiki)
  for (const c of bySpend) {
    if (c.avg_ctr > 0 && c.avg_ctr < 1 && c.total_spend > 100) {
      insights.push({
        type: "warning",
        title: `CTR rendah: ${c.campaign_name}`,
        description: `CTR ${formatPercent(c.avg_ctr)} di bawah 1%. Kreatif iklan perlu diperbaiki untuk tarik lebih klik.`,
        metric: "CTR",
        value: formatPercent(c.avg_ctr),
      });
    }
  }

  // Rule 4: Spend increase >20% week over week (overall)
  for (const c of bySpend) {
    const weekly = getWeeklyData(c.metrics);
    if (!weekly) continue;
    if (weekly.previous.spend > 0) {
      const change =
        ((weekly.current.spend - weekly.previous.spend) /
          weekly.previous.spend) *
        100;
      if (change > 20) {
        insights.push({
          type: "info",
          title: `Perbelanjaan meningkat: ${c.campaign_name}`,
          description: `Spend meningkat ${change.toFixed(0)}% berbanding minggu lepas (${formatMYR(weekly.previous.spend)} → ${formatMYR(weekly.current.spend)}).`,
          metric: "Spend Change",
          value: `+${change.toFixed(0)}%`,
        });
      }
    }
  }

  // Rule 5: Conversion rate drop >30% week over week
  for (const c of bySpend) {
    const weekly = getWeeklyData(c.metrics);
    if (!weekly) continue;
    const prevRate =
      weekly.previous.clicks > 0
        ? weekly.previous.conversions / weekly.previous.clicks
        : 0;
    const currRate =
      weekly.current.clicks > 0
        ? weekly.current.conversions / weekly.current.clicks
        : 0;
    if (prevRate > 0 && currRate > 0) {
      const drop = ((prevRate - currRate) / prevRate) * 100;
      if (drop > 30) {
        insights.push({
          type: "action",
          title: `Kadar conversion menurun: ${c.campaign_name}`,
          description: `Conversion rate jatuh ${drop.toFixed(0)}% berbanding minggu lepas. Semak landing page dan pengalaman pengguna.`,
          metric: "Conv. Rate Drop",
          value: `-${drop.toFixed(0)}%`,
        });
      }
    }
  }

  // Rule 6: High spend but zero conversions
  for (const c of bySpend) {
    if (c.total_spend > 200 && c.total_conversions === 0) {
      insights.push({
        type: "warning",
        title: `Spend tinggi, tiada conversion: ${c.campaign_name}`,
        description: `Kempen ini berbelanja ${formatMYR(c.total_spend)} tetapi menghasilkan 0 conversion. Sila semak targeting dan landing page.`,
        metric: "Spend / Conv",
        value: `${formatMYR(c.total_spend)} / 0`,
      });
    }
  }

  // Rule 7: Best performing campaign highlight
  const bestCampaign = bySpend.find((c) => c.avg_roas > 0 && c.total_conversions > 0);
  if (bestCampaign && bestCampaign.avg_roas > 2) {
    insights.push({
      type: "positive",
      title: `Kempen terbaik: ${bestCampaign.campaign_name}`,
      description: `Kempen ini menonjol dengan ROAS ${bestCampaign.avg_roas.toFixed(2)}× dan ${bestCampaign.total_conversions} conversion. Teruskan pengoptimuman.`,
      metric: "ROAS",
      value: `${bestCampaign.avg_roas.toFixed(2)}×`,
    });
  }

  return insights.slice(0, 7);
}