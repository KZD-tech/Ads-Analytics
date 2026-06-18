import clsx from "clsx";
import type { N8nSyncLog } from "@/types/ads";
import { formatDateTimeDMY } from "@/lib/metrics";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function SyncStatusBadge({ sync }: { sync: N8nSyncLog }) {
  const icon =
    sync.status === "success"
      ? CheckCircle
      : sync.status === "partial"
        ? AlertCircle
        : XCircle;

  const Icon = icon;
  const color =
    sync.status === "success"
      ? "text-success"
      : sync.status === "partial"
        ? "text-warning"
        : "text-danger";

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
      <Icon size={16} className={color} />
      <div className="text-xs">
        <span className="text-text-secondary">Sync terakhir: </span>
        <span className="text-text-primary">
          {formatDateTimeDMY(sync.synced_at)}
        </span>
        <span className={clsx("ml-1 font-medium", color)}>
          ({sync.status})
        </span>
      </div>
    </div>
  );
}