import clsx from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number | null; // percentage change
  icon?: React.ReactNode;
  accent?: "primary" | "meta" | "google" | "success" | "warning" | "danger";
}

export default function MetricCard({
  title,
  value,
  subtitle,
  change,
  icon,
  accent = "primary",
}: MetricCardProps) {
  const accentColor = {
    primary: "text-primary",
    meta: "text-meta",
    google: "text-google",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[accent];

  const TrendIcon =
    change !== null && change !== undefined
      ? change > 0
        ? TrendingUp
        : change < 0
          ? TrendingDown
          : Minus
      : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-secondary">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-text-primary">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>
          )}
        </div>
        {icon && <div className={clsx("shrink-0", accentColor)}>{icon}</div>}
      </div>

      {change !== null && change !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {TrendIcon && (
            <span
              className={clsx(
                "flex items-center gap-0.5 font-medium",
                change > 0
                  ? "text-success"
                  : change < 0
                    ? "text-danger"
                    : "text-text-secondary",
              )}
            >
              <TrendIcon size={14} />
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
          <span className="text-text-secondary">vs minggu lepas</span>
        </div>
      )}
    </div>
  );
}