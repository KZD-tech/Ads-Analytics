import { notFound } from "next/navigation";
import { getDefaultDateRange } from "@/lib/dashboard-data";
import { getCampaignGroupDetail, getUngroupedCampaigns } from "@/lib/campaign-groups";
import CampaignGroupDetailClient from "./CampaignGroupDetailClient";

export default async function CampaignGroupDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string; to?: string };
}) {
  const { id } = params;
  const defaultRange = getDefaultDateRange(30);
  const from = searchParams.from || defaultRange.from;
  const to = searchParams.to || defaultRange.to;

  const group = await getCampaignGroupDetail(id, from, to);
  if (!group) {
    notFound();
  }

  const ungrouped = await getUngroupedCampaigns(from, to);
  const ungroupedSimple = ungrouped.map((c) => ({
    id: c.id,
    campaign_name: c.campaign_name,
    campaign_id_external: c.campaign_id_external,
  }));

  return (
    <CampaignGroupDetailClient
      group={group}
      from={from}
      to={to}
      ungroupedCampaigns={ungroupedSimple}
    />
  );
}