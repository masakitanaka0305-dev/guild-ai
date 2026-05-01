"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plug, CheckCircle2 } from "lucide-react";
import { getDemoOwnedMds } from "@/lib/matching";
import { pickBestFitMd } from "@/lib/md-pickfit";
import { getProject } from "@/lib/projects";

interface Props {
  projectId: string;
  /** When true, the section becomes a fixed mobile bottom bar (md+ stays static). */
  sticky?: boolean;
  /** When true, the Apply button is disabled — Net Payout is negative. */
  underwater?: boolean;
}

const STORAGE_PREFIX = "pluggedIn:";

function pluggedInKey(projectId: string, guildId: string): string {
  return `${STORAGE_PREFIX}${projectId}:${guildId}`;
}

// ─── Confirmation modal — fired right after a successful plug-in ─────────────

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
}

function PluggedInConfirmModal({ open, onClose }: ConfirmModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        // Trivial focus trap: keep focus inside the dialog.
        const root = overlayRef.current;
        if (!root) return;
        const focusable = root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={overlayRef}
      data-testid="plugin-confirm-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plugin-confirm-heading"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6"
      onClick={onClose}
    >
      <div
        className="bg-[#162035] rounded-2xl shadow-xl p-6 w-full max-w-md max-w-[calc(100vw-32px)] border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="plugin-confirm-heading"
          className="text-white font-semibold text-lg leading-snug"
        >
          接続完了
        </h2>
        <p className="mt-3 text-slate-200 text-sm leading-relaxed">
          あなたの知能（MD）に基づいた最適な条件で、案件にエントリーしました。参画中、あなたの知能資産が AI エージェントとして業務をサポートします。
        </p>
        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 focus:outline focus:outline-2 focus:outline-cyan-400"
          >
            閉じる
          </button>
          <Link
            href="/applications"
            onClick={onClose}
            className="rounded-full bg-cyan-400 text-[#0B1121] px-5 py-2 text-xs font-bold hover:bg-cyan-300 focus:outline focus:outline-2 focus:outline-cyan-400 text-center"
          >
            マイページで確認 →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Plug-in CTA ─────────────────────────────────────────────────────────────

export function PlugInApply({ projectId, sticky = false, underwater = false }: Props) {
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
  const [pluggedIn, setPluggedIn] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Re-hydrate from localStorage so the Plugged-in state persists across visits.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!selectedMd) return;
    try {
      const raw = window.localStorage.getItem(pluggedInKey(projectId, selectedMd));
      if (raw) setPluggedIn(true);
    } catch { /* SSR / blocked storage — silently ignore */ }
  }, [projectId, selectedMd]);

  async function handleApply() {
    if (!selectedMd || pluggedIn) return;
    setApplying(true);
    try {
      await fetch("/api/applications/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, mdGuildId: selectedMd }),
      });
      try {
        window.localStorage.setItem(
          pluggedInKey(projectId, selectedMd),
          new Date().toISOString(),
        );
      } catch { /* ignore */ }
      setPluggedIn(true);
      setModalOpen(true);
    } finally {
      setApplying(false);
    }
  }

  const wrapperClass = sticky
    ? "md:static fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-auto left-0 right-0 z-30 px-4 py-3 bg-[#0B1121]/95 backdrop-blur border-t border-white/10 md:border-0 md:bg-transparent md:backdrop-blur-0 md:p-0 space-y-3"
    : "space-y-3";
  const wrapperRole = sticky ? "region" : undefined;
  const wrapperLabel = sticky ? "主要アクション" : undefined;

  return (
    <div className={wrapperClass} role={wrapperRole} aria-label={wrapperLabel}>
      <div>
        <label htmlFor="md-select" className="text-xs text-[#E2E8F0] block mb-1">
          知能をプラグイン — 知能資産を選ぶ
        </label>
        <select
          id="md-select"
          value={selectedMd}
          onChange={e => setSelectedMd(e.target.value)}
          disabled={pluggedIn}
          className="w-full bg-[#162035] border border-[#22D3EE]/30 focus:border-[#22D3EE] text-[#E2E8F0] rounded-md px-3 py-2 text-sm outline-cyan-400 disabled:opacity-60"
        >
          {ownedMds.map(md => (
            <option key={md.id} value={md.id}>
              {md.id} [{md.rank}]
            </option>
          ))}
        </select>
        {preselect.mdId && preselect.reason && !pluggedIn && (
          <p
            data-testid="ai-preselect-note"
            className="mt-1 text-[11px] text-slate-400"
          >
            {preselect.reason}
          </p>
        )}
      </div>

      {pluggedIn ? (
        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-label="接続済み"
          data-testid="apply-cta-plugged-in"
          className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 bg-emerald-500/10 ring-1 ring-emerald-400/40 text-emerald-300 rounded-full text-sm font-semibold"
        >
          <CheckCircle2 aria-hidden className="w-4 h-4 stroke-emerald-300" />
          Plugged-in / デプロイ済み
        </button>
      ) : (
        <button
          onClick={handleApply}
          disabled={!selectedMd || applying || underwater}
          aria-label="知能をプラグイン（案件に参画）"
          data-testid="apply-cta-plug-in"
          className="w-full px-4 py-3 bg-[#22D3EE] text-[#0B1121] font-bold rounded-full disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] hover:shadow-[0_0_0_2px_rgba(34,211,238,0.4),0_0_18px_rgba(34,211,238,0.25)] active:shadow-inner outline-none focus:outline focus:outline-2 focus:outline-cyan-400 inline-flex items-center justify-center gap-2"
        >
          <Plug aria-hidden className="w-4 h-4 stroke-[#0B1121]" />
          {applying ? "プラグイン中..." : "知能をプラグイン（案件に参画）"}
        </button>
      )}

      {!pluggedIn && (
        <p className="mt-1 text-xs text-cyan-400/70 text-center leading-snug">
          あなたの思考をコピーした AI が、企業のプロジェクトに参加します
        </p>
      )}

      <PluggedInConfirmModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
