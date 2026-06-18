"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

interface CampaignFiltersProps {
  currentFrom: string;
  currentTo: string;
  currentPlatform?: string;
  currentStatus?: string;
}

export default function CampaignFilters({
  currentFrom,
  currentTo,
  currentPlatform,
  currentStatus,
}: CampaignFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);
  const [platform, setPlatform] = useState(currentPlatform || "");
  const [status, setStatus] = useState(currentStatus || "");

  function update() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (platform) params.set("platform", platform);
    if (status) params.set("status", status);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Dari</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Hingga</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Platform</label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary"
        >
          <option value="">Semua</option>
          <option value="meta">Meta</option>
          <option value="google">Google</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary"
        >
          <option value="">Semua</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <button
        onClick={update}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
      >
        Tapis
      </button>
    </div>
  );
}