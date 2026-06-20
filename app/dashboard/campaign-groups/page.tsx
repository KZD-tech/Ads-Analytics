import { getDefaultDateRange } from "@/lib/dashboard-data";
import { getCampaignGroupsWithAggregates } from "@/lib/campaign-groups";
import CampaignGroupsClient from "./CampaignGroupsClient";

export default async function CampaignGroupsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const defaultRange = getDefaultDateRange(30);
  const from = searchParams.from || defaultRange.from;
  const to = searchParams.to || defaultRange.to;

  const groups = await getCampaignGroupsWithAggregates(from, to);

  return <CampaignGroupsClient groups={groups} from={from} to={to} />;
}