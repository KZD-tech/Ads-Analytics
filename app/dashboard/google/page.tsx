import { getDefaultDateRange } from "@/lib/dashboard-data";
import PlatformPage from "../PlatformPage";

export default async function GooglePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const defaultRange = getDefaultDateRange(30);
  const from = sp.from || defaultRange.from;
  const to = sp.to || defaultRange.to;

  return <PlatformPage platform="google" from={from} to={to} />;
}