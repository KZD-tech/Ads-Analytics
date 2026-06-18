import { Suspense } from "react";
import { getDefaultDateRange } from "@/lib/dashboard-data";
import { subDays, format } from "date-fns";
import OverviewClient from "./OverviewClient";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  try {
    const defaultRange = getDefaultDateRange(30);
    const from = searchParams.from || defaultRange.from;
    const to = searchParams.to || defaultRange.to;

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
  } catch (err: unknown) {
    // Catch errors INSIDE the server component and render them as JSX.
    // Next.js production mode sanitizes errors that reach the error boundary,
    // so we must intercept and display the message here.
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "";
    return (
      <div className="p-8">
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-danger mb-2">
            Debug: Server Component Error
          </h2>
          <p className="text-sm text-text-primary mb-4 font-mono break-all">{message}</p>
          {stack && (
            <details className="text-xs text-text-secondary">
              <summary className="cursor-pointer mb-2">Stack trace</summary>
              <pre className="whitespace-pre-wrap break-all text-xs">{stack}</pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}