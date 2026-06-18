"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard/error-boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-center max-w-md">
        <h2 className="text-lg font-bold text-danger mb-2">
          Ralat Dashboard
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {error.message || "Berlaku ralat semasa memuatkan dashboard."}
        </p>
        {error.digest && (
          <p className="text-xs text-text-secondary mb-4">
            Digest: {error.digest}
          </p>
        )}
        <details className="mb-4 text-left text-xs text-text-secondary">
          <summary className="cursor-pointer">Butiran teknikal</summary>
          <pre className="mt-2 whitespace-pre-wrap break-all">
            {error.stack || error.toString()}
          </pre>
        </details>
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          Cuba Semula
        </button>
      </div>
    </div>
  );
}