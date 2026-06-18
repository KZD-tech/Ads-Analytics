import { getDefaultDateRange } from "@/lib/dashboard-data";
import PlatformPage from "../PlatformPage";

export default async function GooglePage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const defaultRange = getDefaultDateRange(30);
  const from = searchParams.from || defaultRange.from;
  const to = searchParams.to || defaultRange.to;

  return <PlatformPage platform="google" from={from} to={to} />;
}