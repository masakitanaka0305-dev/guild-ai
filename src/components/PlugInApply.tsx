"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDemoOwnedMds } from "@/lib/matching";

interface Props {
  projectId: string;
}

export function PlugInApply({ projectId }: Props) {
  const router = useRouter();
  const ownedMds = getDemoOwnedMds("demo-user");
  const [selectedMd, setSelectedMd] = useState(ownedMds[0]?.id ?? "");
  const [applying, setApplying] = useState(false);

  async function handleApply() {
    if (!selectedMd) return;
    setApplying(true);
    try {
      await fetch("/api/applications/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, mdGuildId: selectedMd }),
      });
      router.push("/applications");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="md-select" className="text-xs text-slate-400 block mb-1">Select MD</label>
        <select
          id="md-select"
          value={selectedMd}
          onChange={e => setSelectedMd(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-md px-3 py-2 text-sm"
        >
          {ownedMds.map(md => (
            <option key={md.id} value={md.id}>
              {md.id} [{md.rank}]
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleApply}
        disabled={!selectedMd || applying}
        className="w-full px-4 py-3 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-40 min-h-[44px]"
      >
        {applying ? "Applying…" : "Apply with selected MD"}
      </button>
    </div>
  );
}
