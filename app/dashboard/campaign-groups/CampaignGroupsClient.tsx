"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FolderOpen, Megaphone } from "lucide-react";
import { formatMYR, formatNumber, formatPercent } from "@/lib/metrics";
import { CreateGroupModal } from "@/components/dashboard/CampaignGroupManager";
import clsx from "clsx";
import type { CampaignGroupWithAggregates } from "@/types/ads";

export default function CampaignGroupsClient({
  groups,
  from,
  to,
}: {
  groups: CampaignGroupWithAggregates[];
  from: string;
  to: string;
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Kempen Teras</h1>
          <p className="text-sm text-text-secondary">
            {from} → {to} · {groups.length} kumpulan
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <Plus size={18} />
          Cipta Kempen Teras
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <FolderOpen size={40} className="mx-auto mb-3 text-text-secondary" />
          <h2 className="text-lg font-medium text-text-primary">Tiada Kempen Teras lagi</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Cipta kumpulan untuk mengumpulkan kempen dan lihat agregat metrik.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <Plus size={18} />
            Cipta Kempen Teras
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/dashboard/campaign-groups/${g.id}?from=${from}&to=${to}`}
              className="group rounded-xl border border-border bg-surface p-5 transition hover:border-primary/50 hover:bg-surface/80"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-text-primary group-hover:text-primary">
                    {g.group_name}
                  </h3>
                  {g.description && (
                    <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">
                      {g.description}
                    </p>
                  )}
                </div>
                <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-bg px-2 py-1 text-xs font-medium text-text-secondary">
                  <Megaphone size={12} />
                  {g.campaign_count}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-text-secondary">Spend</p>
                  <p className="font-medium text-text-primary">{formatMYR(g.total_spend)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Impr.</p>
                  <p className="font-medium text-text-primary">{formatNumber(g.total_impressions)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Klik</p>
                  <p className="font-medium text-text-primary">{formatNumber(g.total_clicks)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Conv.</p>
                  <p className="font-medium text-text-primary">{formatNumber(g.total_conversions)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">CTR</p>
                  <p className="font-medium text-text-primary">{formatPercent(g.avg_ctr)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">ROAS</p>
                  <p className={clsx("font-medium", g.avg_roas >= 3 ? "text-success" : g.avg_roas < 1.5 ? "text-danger" : "text-text-primary")}>
                    {g.avg_roas > 0 ? `${g.avg_roas.toFixed(2)}×` : "-"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}