"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import CampaignTable from "@/components/dashboard/CampaignTable";
import { buildCampaignRows } from "@/lib/campaign-utils";
import { AssignCampaignModal } from "@/components/dashboard/CampaignGroupManager";
import type { CampaignRow } from "@/lib/campaign-utils";
import type { AdCampaignGroup } from "@/types/ads";

interface CampaignWithGroup {
  campaign_id: string;
  campaign_name: string;
  group_id: string | null;
  group_name?: string;
}

export default function CampaignsTableWithAssign({
  rows,
  groups,
  campaigns,
}: {
  rows: CampaignRow[];
  groups: AdCampaignGroup[];
  campaigns: CampaignWithGroup[];
}) {
  const [assigning, setAssigning] = useState<string | null>(null);

  const assigningCampaign = assigning
    ? campaigns.find((c) => c.campaign_id === assigning)
    : null;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full">
          <thead className="border-b border-border bg-bg/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                Kempen
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                Kempen Teras
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                Spend
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                ROAS
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                Teras
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const campaignInfo = campaigns.find(
                (c) => c.campaign_id === row.campaign.id,
              );
              return (
                <tr
                  key={row.campaign.id}
                  className="transition hover:bg-border/30"
                >
                  <td className="max-w-[200px] px-4 py-3">
                    <span className="block truncate text-sm font-medium text-text-primary">
                      {row.campaign.campaign_name}
                    </span>
                    <span className="text-xs capitalize text-text-secondary">
                      {row.campaign.objective}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {campaignInfo?.group_name ? (
                      <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {campaignInfo.group_name}
                      </span>
                    ) : (
                      <span className="text-xs text-text-secondary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm text-text-primary">
                    {new Intl.NumberFormat("ms-MY", {
                      style: "currency",
                      currency: "MYR",
                      minimumFractionDigits: 2,
                    }).format(row.spend)}
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
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setAssigning(row.campaign.id)}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <FolderPlus size={14} />
                      {campaignInfo?.group_name ? "Tukar" : "Assign"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                  Tiada data kempen
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {assigningCampaign && (
        <AssignCampaignModal
          campaignId={assigningCampaign.campaign_id}
          campaignName={assigningCampaign.campaign_name}
          currentGroupId={assigningCampaign.group_id}
          groups={groups}
          onClose={() => setAssigning(null)}
        />
      )}
    </div>
  );
}