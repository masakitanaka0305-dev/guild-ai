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
        <label htmlFor="md-select" className="text-xs text-[#E2E8F0] block mb-1">Select MD</label>
        <select
          id="md-select"
          value={selectedMd}
          onChange={e => setSelectedMd(e.target.value)}
          className="w-full bg-[#162035] border border-[#22D3EE]/30 focus:border-[#22D3EE] text-[#E2E8F0] rounded-md px-3 py-2 text-sm outline-cyan-400"
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
        className="w-full px-4 py-3 bg-[#22D3EE] text-[#0B1121] font-bold rounded-full disabled:opacity-40 min-h-[44px] hover:shadow-[0_0_0_2px_rgba(34,211,238,0.4),0_0_18px_rgba(34,211,238,0.25)] active:shadow-inner outline-none focus:outline focus:outline-2 focus:outline-cyan-400"
      >
        {applying ? "Applying…" : "Apply with selected MD"}
      </button>
    </div>
  );
}
