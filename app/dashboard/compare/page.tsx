import {
  getCampaignsWithMetrics,
  getCampaignAggregates,
  getDefaultDateRange,
} from "@/lib/dashboard-data";
import { formatMYR, formatNumber, formatPercent } from "@/lib/metrics";
import CompareChart from "./CompareChart";
import { Trophy } from "lucide-react";
import clsx from "clsx";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const defaultRange = getDefaultDateRange(30);
  const from = sp.from || defaultRange.from;
  const to = sp.to || defaultRange.to;

  const [metaCampaigns, googleCampaigns] = await Promise.all([
    getCampaignsWithMetrics(from, to, "meta"),
    getCampaignsWithMetrics(from, to, "google"),
  ]);

  const metaAgg = getCampaignAggregates(metaCampaigns);
  const googleAgg = getCampaignAggregates(googleCampaigns);

  const metrics = [
    { key: "spend", label: "Spend", meta: metaAgg.spend, google: googleAgg.spend, format: (v: number) => formatMYR(v), lowerBetter: false },
    { key: "clicks", label: "Clicks", meta: metaAgg.clicks, google: googleAgg.clicks, format: (v: number) => formatNumber(v), lowerBetter: false },
    { key: "conversions", label: "Conversions", meta: metaAgg.conversions, google: googleAgg.conversions, format: (v: number) => formatNumber(v), lowerBetter: false },
    { key: "ctr", label: "CTR", meta: metaAgg.ctr, google: googleAgg.ctr, format: (v: number) => formatPercent(v), lowerBetter: false },
    { key: "roas", label: "ROAS", meta: metaAgg.roas, google: googleAgg.roas, format: (v: number) => `${v.toFixed(2)}×`, lowerBetter: false },
    { key: "cpc", label: "CPC", meta: metaAgg.cpc, google: googleAgg.cpc, format: (v: number) => formatMYR(v), lowerBetter: true },
    { key: "cpm", label: "CPM", meta: metaAgg.cpm, google: googleAgg.cpm, format: (v: number) => formatMYR(v), lowerBetter: true },
    { key: "cpa", label: "CPA", meta: metaAgg.cpa, google: googleAgg.cpa, format: (v: number) => formatMYR(v), lowerBetter: true },
  ];

  const chartData = metrics.map((m) => ({
    metric: m.label,
    Meta: m.meta,
    Google: m.google,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          Bandingan Meta vs Google
        </h1>
        <p className="text-sm text-text-secondary">
          {from} → {to}
        </p>
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">
          Perbandingan Metrics
        </h2>
        <CompareChart data={chartData} />
      </div>

      {/* Side-by-side comparison cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {metrics.map((m) => {
          const metaWins = m.lowerBetter ? m.meta < m.google : m.meta > m.google;
          const googleWins = m.lowerBetter ? m.google < m.meta : m.google > m.meta;
          const winner = metaWins ? "meta" : googleWins ? "google" : "tie";

          return (
            <div
              key={m.key}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  {m.label}
                </h3>
                {winner !== "tie" && (
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                      winner === "meta"
                        ? "bg-meta/15 text-meta"
                        : "bg-google/15 text-google",
                    )}
                  >
                    <Trophy size={12} />
                    {winner === "meta" ? "Meta" : "Google"} menang
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-text-secondary">Meta</div>
                  <div
                    className={clsx(
                      "mt-1 text-lg font-bold tabular-nums",
                      winner === "meta" ? "text-meta" : "text-text-primary",
                    )}
                  >
                    {m.format(m.meta)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-secondary">Google</div>
                  <div
                    className={clsx(
                      "mt-1 text-lg font-bold tabular-nums",
                      winner === "google" ? "text-google" : "text-text-primary",
                    )}
                  >
                    {m.format(m.google)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}