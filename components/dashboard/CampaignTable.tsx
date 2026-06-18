"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatMYR, formatNumber, formatPercent } from "@/lib/metrics";
import type { CampaignRow } from "@/lib/campaign-utils";
import clsx from "clsx";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

type SortKey = "spend" | "ctr" | "roas" | "conversions" | "impressions" | "clicks";

interface CampaignTableProps {
  rows: CampaignRow[];
  showPlatform?: boolean;
  limit?: number;
  sortable?: boolean;
  showLink?: boolean;
}

export default function CampaignTable({
  rows,
  showPlatform = true,
  limit,
  sortable = true,
  showLink = true,
}: CampaignTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const data = [...rows].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDir === "desc" ? -diff : diff;
    });
    return limit ? data.slice(0, limit) : data;
  }, [rows, sortKey, sortDir, limit]);

  function toggleSort(key: SortKey) {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function Header({ label, sortKey: key }: { label: string; sortKey?: SortKey }) {
    return (
      <th
        className={clsx(
          "px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary",
          key && sortable && "cursor-pointer select-none hover:text-text-primary",
        )}
        onClick={key ? () => toggleSort(key) : undefined}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {key && sortKey === key && (
            sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full">
        <thead className="border-b border-border bg-bg/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
              Kempen
            </th>
            {showPlatform && (
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                Platform
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
              Status
            </th>
            <Header label="Spend" sortKey="spend" />
            <Header label="Impr." sortKey="impressions" />
            <Header label="Klik" sortKey="clicks" />
            <Header label="CTR" sortKey="ctr" />
            <Header label="ROAS" sortKey="roas" />
            <Header label="Conv." sortKey="conversions" />
            {showLink && <th className="px-4 py-3"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.length === 0 && (
            <tr>
              <td
                colSpan={showLink ? 10 : 9}
                className="px-4 py-8 text-center text-text-secondary"
              >
                Tiada data kempen
              </td>
            </tr>
          )}
          {sorted.map((row) => (
            <tr
              key={row.campaign.id}
              className={clsx(
                "transition hover:bg-border/30",
                showLink && "cursor-pointer",
              )}
              onClick={
                showLink
                  ? () =>
                    window.location.assign(
                      `/dashboard/campaigns/${row.campaign.id}`,
                    )
                  : undefined
              }
            >
              <td className="max-w-[200px] px-4 py-3">
                <span className="block truncate text-sm font-medium text-text-primary">
                  {row.campaign.campaign_name}
                </span>
                <span className="text-xs capitalize text-text-secondary">
                  {row.campaign.objective}
                </span>
              </td>
              {showPlatform && (
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
                      row.platform_name === "meta"
                        ? "bg-meta/15 text-meta"
                        : "bg-google/15 text-google",
                    )}
                  >
                    {row.platform_name === "meta" ? "Meta" : "Google"}
                  </span>
                </td>
              )}
              <td className="px-4 py-3">
                <span
                  className={clsx(
                    "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                    row.campaign.status === "active"
                      ? "bg-success/15 text-success"
                      : row.campaign.status === "paused"
                        ? "bg-warning/15 text-warning"
                        : "bg-border text-text-secondary",
                  )}
                >
                  {row.campaign.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-sm text-text-primary">
                {formatMYR(row.spend)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-sm text-text-secondary">
                {formatNumber(row.impressions)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-sm text-text-secondary">
                {formatNumber(row.clicks)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-sm text-text-secondary">
                {formatPercent(row.ctr)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-sm">
                <span
                  className={
                    row.roas >= 3
                      ? "text-success"
                      : row.roas < 1.5
                        ? "text-danger"
                        : "text-text-primary"
                  }
                >
                  {row.roas > 0 ? `${row.roas.toFixed(2)}×` : "-"}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-sm text-text-secondary">
                {formatNumber(row.conversions)}
              </td>
              {showLink && (
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/campaigns/${row.campaign.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink size={14} />
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}