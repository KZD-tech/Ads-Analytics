"use client";

import { useState } from "react";
import { format } from "date-fns";
import clsx from "clsx";
import { Calendar } from "lucide-react";

interface DateRangePickerProps {
  value: { from: string; to: string };
  onChange: (range: { from: string; to: string }) => void;
}

const presets = [
  { label: "7 Hari", days: 7 },
  { label: "14 Hari", days: 14 },
  { label: "30 Hari", days: 30 },
  { label: "90 Hari", days: 90 },
];

export default function DateRangePicker({
  value,
  onChange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  function applyPreset(days: number) {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    onChange({
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
    });
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-secondary transition hover:text-text-primary"
      >
        <Calendar size={16} />
        <span className="hidden sm:inline">
          {value.from} → {value.to}
        </span>
        <span className="sm:hidden">Tarikh</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-border bg-surface p-3 shadow-xl">
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-text-secondary">
              Tempoh Pantas
            </div>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.days}
                  onClick={() => applyPreset(p.days)}
                  className={clsx(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    "bg-bg text-text-secondary hover:bg-primary hover:text-white",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="my-3 border-t border-border" />
            <div className="space-y-2">
              <div>
                <label className="text-xs text-text-secondary">Dari</label>
                <input
                  type="date"
                  value={value.from}
                  onChange={(e) =>
                    onChange({ ...value, from: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text-primary"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary">Hingga</label>
                <input
                  type="date"
                  value={value.to}
                  onChange={(e) => onChange({ ...value, to: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text-primary"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}