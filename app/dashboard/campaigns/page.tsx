import { getCampaignsWithMetrics, getDefaultDateRange } from "@/lib/dashboard-data";
import { getCampaignGroups } from "@/lib/campaign-groups";
import { buildCampaignRows } from "@/lib/campaign-utils";
import CampaignFilters from "./CampaignFilters";
import CampaignsTableWithAssign from "./CampaignsTableWithAssign";
import type { AdCampaignGroup } from "@/types/ads";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: {
    from?: string;
    to?: string;
    platform?: string;
    status?: string;
  };
}) {
  const defaultRange = getDefaultDateRange(30);
  const from = searchParams.from || defaultRange.from;
  const to = searchParams.to || defaultRange.to;
  const platform = searchParams.platform as "meta" | "google" | undefined;
  const status = searchParams.status as "active" | "paused" | "archived" | undefined;

  const [campaigns, groups] = await Promise.all([
    getCampaignsWithMetrics(from, to, platform),
    getCampaignGroups(),
  ]);
  let rows = buildCampaignRows(campaigns);

  if (status) {
    rows = rows.filter((r) => r.campaign.status === status);
  }

  const groupMap: Record<string, string> = {};
  for (const g of groups as AdCampaignGroup[]) {
    groupMap[g.id] = g.group_name;
  }

  const campaignsWithGroup = campaigns.map((c) => ({
    campaign_id: c.id,
    campaign_name: c.campaign_name,
    group_id: c.group_id ?? null,
    group_name: c.group_id ? groupMap[c.group_id] : undefined,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Kempen</h1>
        <p className="text-sm text-text-secondary">
          {from} → {to} · {rows.length} kempen
        </p>
      </div>

      <CampaignFilters
        currentFrom={from}
        currentTo={to}
        currentPlatform={platform}
        currentStatus={status}
      />

      <CampaignsTableWithAssign
        rows={rows}
        groups={groups}
        campaigns={campaignsWithGroup}
      />
    </div>
  );
}