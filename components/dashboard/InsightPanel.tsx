import clsx from "clsx";
import type { Insight } from "@/types/ads";
import { AlertTriangle, TrendingUp, Info, Wrench } from "lucide-react";

const iconMap = {
  warning: AlertTriangle,
  positive: TrendingUp,
  info: Info,
  action: Wrench,
};

const colorMap = {
  warning: "border-warning/30 bg-warning/10 text-warning",
  positive: "border-success/30 bg-success/10 text-success",
  info: "border-primary/30 bg-primary/10 text-primary",
  action: "border-danger/30 bg-danger/10 text-danger",
};

export default function InsightPanel({ insights }: { insights: Insight[] }) {
  if (!insights.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-2 text-sm font-semibold text-text-primary">
          Insights
        </h3>
        <p className="text-sm text-text-secondary">
          Tiada insight tersedia. Pastikan data telah disinkronkan.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">
        Insights Automatik
      </h3>
      <div className="space-y-3">
        {insights.map((insight, i) => {
          const Icon = iconMap[insight.type];
          return (
            <div
              key={i}
              className={clsx(
                "flex items-start gap-3 rounded-lg border p-3",
                colorMap[insight.type],
              )}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {insight.title}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {insight.description}
                </p>
              </div>
              {insight.value && (
                <span className="shrink-0 text-sm font-bold tabular-nums">
                  {insight.value}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}