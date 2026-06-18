import { Suspense } from "react";
import { getDefaultDateRange } from "@/lib/dashboard-data";
import { subDays, format } from "date-fns";
import OverviewClient from "./OverviewClient";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const defaultRange = getDefaultDateRange(30);
  const from = sp.from || defaultRange.from;
  const to = sp.to || defaultRange.to;

  // Previous 7 days for comparison
  const prevFrom = format(subDays(new Date(from), 7), "yyyy-MM-dd");
  const prevTo = format(subDays(new Date(from), 1), "yyyy-MM-dd");

  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-text-secondary">
          Memuatkan dashboard...
        </div>
      }
    >
      <OverviewClient from={from} to={to} prevFrom={prevFrom} prevTo={prevTo} />
    </Suspense>
  );
}