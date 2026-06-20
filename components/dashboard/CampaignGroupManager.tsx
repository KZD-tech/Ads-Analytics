"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { X, Plus, FolderPlus, Check } from "lucide-react";
import type { AdCampaignGroup } from "@/types/ads";

export function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSave() {
    if (!name.trim()) {
      setError("Nama kumpulan diperlukan");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("ad_campaign_groups")
      .insert({ group_name: name.trim(), description: description.trim() || null });
    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Kempen Teras Baru</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Nama Kempen Teras
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth: Raya 2026, Bulanan Q1..."
              className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Penerangan (pilihan)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Penerangan ringkas..."
              className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus size={18} />
            {saving ? "Menyimpan..." : "Cipta Kempen Teras"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssignCampaignModal({
  campaignId,
  campaignName,
  currentGroupId,
  groups,
  onClose,
}: {
  campaignId: string;
  campaignName: string;
  currentGroupId: string | null;
  groups: AdCampaignGroup[];
  onClose: () => void;
}) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(currentGroupId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleAssign() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("ad_campaigns")
      .update({ group_id: selectedGroup })
      .eq("id", campaignId);
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    router.refresh();
    onClose();
  }

  async function handleUnassign() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("ad_campaigns")
      .update({ group_id: null })
      .eq("id", campaignId);
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Assign ke Kempen Teras</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-sm text-text-secondary truncate">{campaignName}</p>
        <div className="space-y-2">
          {groups.length === 0 && (
            <p className="text-sm text-text-secondary">Tiada Kempen Teras. Cipta satu dahulu.</p>
          )}
          {groups.map((g) => (
            <label
              key={g.id}
              className={clsx(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition",
                selectedGroup === g.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-border/30",
              )}
            >
              <input
                type="radio"
                name="group"
                checked={selectedGroup === g.id}
                onChange={() => setSelectedGroup(g.id)}
                className="accent-primary"
              />
              <span className="text-sm font-medium text-text-primary">{g.group_name}</span>
            </label>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-5 flex gap-3">
          {currentGroupId && (
            <button
              onClick={handleUnassign}
              disabled={saving}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-border/30 disabled:opacity-50"
            >
              Keluarkan
            </button>
          )}
          <button
            onClick={handleAssign}
            disabled={saving || !selectedGroup}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            <FolderPlus size={16} />
            {saving ? "Menyimpan..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteGroupButton({
  groupId,
  groupName,
  onDelete,
}: {
  groupId: string;
  groupName: string;
  onDelete?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("ad_campaign_groups").delete().eq("id", groupId);
    if (error) {
      console.error("[delete group]", error.message);
      setDeleting(false);
      return;
    }
    router.refresh();
    onDelete?.();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-danger hover:underline"
      >
        Padam
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary">Padam &ldquo;{groupName}&rdquo;?</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-md bg-danger px-3 py-1.5 text-xs font-medium text-white hover:bg-danger/90 disabled:opacity-50"
      >
        {deleting ? "..." : "Ya, padam"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-border/30"
      >
        Batal
      </button>
    </div>
  );
}

export function AddCampaignToGroup({
  groupId,
  ungroupedCampaigns,
}: {
  groupId: string;
  ungroupedCampaigns: { id: string; campaign_name: string; campaign_id_external: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleAdd() {
    if (selected.length === 0) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("ad_campaigns")
      .update({ group_id: groupId })
      .in("id", selected);
    if (error) {
      console.error("[add to group]", error.message);
      setSaving(false);
      return;
    }
    router.refresh();
    setOpen(false);
    setSelected([]);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
      >
        <Plus size={16} />
        Tambah Kempen
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Pilih kempen untuk ditambah</h3>
        <button onClick={() => setOpen(false)} className="text-text-secondary hover:text-text-primary">
          <X size={18} />
        </button>
      </div>
      {ungroupedCampaigns.length === 0 ? (
        <p className="text-sm text-text-secondary">Semua kempen telah berada dalam kumpulan.</p>
      ) : (
        <>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {ungroupedCampaigns.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-border/30"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected([...selected, c.id]);
                    } else {
                      setSelected(selected.filter((s) => s !== c.id));
                    }
                  }}
                  className="accent-primary"
                />
                <span className="text-sm text-text-primary">{c.campaign_name}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => {
                setOpen(false);
                setSelected([]);
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-border/30"
            >
              Batal
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || selected.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Check size={16} />
              {saving ? "Menambah..." : `Tambah ${selected.length} kempen`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}