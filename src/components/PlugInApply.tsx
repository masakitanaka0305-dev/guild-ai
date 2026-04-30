"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getDemoOwnedMds } from "@/lib/matching";
import { pickBestFitMd } from "@/lib/md-pickfit";
import { getProject } from "@/lib/projects";

interface Props {
  projectId: string;
  /** When true, the section becomes a fixed mobile bottom bar (md+ stays static). */
  sticky?: boolean;
}

export function PlugInApply({ projectId, sticky = false }: Props) {
  const router = useRouter();
  const ownedMds = useMemo(() => getDemoOwnedMds("demo-user"), []);
  const project = getProject(projectId);
  const preselect = useMemo(
    () =>
      project
        ? pickBestFitMd(ownedMds, project)
        : { mdId: ownedMds[0]?.id ?? null, coveredReqs: 0, rankScore: 0, reason: "" },
    [ownedMds, project],
  );
  const [selectedMd, setSelectedMd] = useState<string>(
    preselect.mdId ?? ownedMds[0]?.id ?? "",
  );
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

  const wrapperClass = sticky
    ? "md:static fixed bottom-16 md:bottom-auto left-0 right-0 z-30 px-4 py-3 bg-[#0B1121]/95 backdrop-blur border-t border-white/10 md:border-0 md:bg-transparent md:backdrop-blur-0 md:p-0 space-y-3"
    : "space-y-3";
  const wrapperRole = sticky ? "region" : undefined;
  const wrapperLabel = sticky ? "主要アクション" : undefined;

  return (
    <div className={wrapperClass} role={wrapperRole} aria-label={wrapperLabel}>
      <div>
        <label htmlFor="md-select" className="text-xs text-[#E2E8F0] block mb-1">
          この知能で応募 — 知能資産を選ぶ
        </label>
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
        {preselect.mdId && preselect.reason && (
          <p
            data-testid="ai-preselect-note"
            className="mt-1 text-[11px] text-slate-400"
          >
            {preselect.reason}
          </p>
        )}
      </div>
      <button
        onClick={handleApply}
        disabled={!selectedMd || applying}
        aria-label="この案件に応募する"
        className="w-full px-4 py-3 bg-[#22D3EE] text-[#0B1121] font-bold rounded-full disabled:opacity-40 min-h-[44px] hover:shadow-[0_0_0_2px_rgba(34,211,238,0.4),0_0_18px_rgba(34,211,238,0.25)] active:shadow-inner outline-none focus:outline focus:outline-2 focus:outline-cyan-400"
      >
        {applying ? "応募中..." : "この案件に応募する"}
      </button>
      <p className="mt-1 text-[11px] text-slate-400 text-center">
        選んだ知能資産があなたのスキル証明になります
      </p>
    </div>
  );
}
