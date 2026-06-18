import { getCampaignsWithMetrics, getDefaultDateRange } from "@/lib/dashboard-data";
import { buildCampaignRows } from "@/components/dashboard/CampaignTable";
import CampaignTable from "@/components/dashboard/CampaignTable";
import CampaignFilters from "./CampaignFilters";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    platform?: string;
    status?: string;
  }>;
}) {
  const sp = await searchParams;
  const defaultRange = getDefaultDateRange(30);
  const from = sp.from || defaultRange.from;
  const to = sp.to || defaultRange.to;
  const platform = sp.platform as "meta" | "google" | undefined;
  const status = sp.status as "active" | "paused" | "archived" | undefined;

  const campaigns = await getCampaignsWithMetrics(from, to, platform);
  let rows = buildCampaignRows(campaigns);

  if (status) {
    rows = rows.filter((r) => r.campaign.status === status);
  }

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

      <CampaignTable rows={rows} />
    </div>
  );
}