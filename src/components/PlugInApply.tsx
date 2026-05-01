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

// ─── Confirmation modal — fired right after a successful entry ───────────────

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
          選ばれました！
        </h2>
        <p className="mt-3 text-slate-200 text-sm leading-relaxed">
          あなたの知恵のカードを、お困りごとに貸し出しました。参加中はあなたの代わりに AI が知恵を活かして働き、使われた分だけお礼が届きます。
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
            参加状況を見る →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Apply CTA ───────────────────────────────────────────────────────────────

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

  // The MD that we'll plug in is fixed by AI Pre-select — no user picker.
  const selectedMdId = preselect.mdId ?? ownedMds[0]?.id ?? "";
  const selectedMd = ownedMds.find((m) => m.id === selectedMdId) ?? null;

  const [applying, setApplying] = useState(false);
  const [pluggedIn, setPluggedIn] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!selectedMdId) return;
    try {
      const raw = window.localStorage.getItem(pluggedInKey(projectId, selectedMdId));
      if (raw) setPluggedIn(true);
    } catch { /* SSR / blocked storage — silently ignore */ }
  }, [projectId, selectedMdId]);

  async function handleApply() {
    if (!selectedMdId || pluggedIn) return;
    setApplying(true);
    try {
      await fetch("/api/applications/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, mdGuildId: selectedMdId }),
      });
      try {
        window.localStorage.setItem(
          pluggedInKey(projectId, selectedMdId),
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
      {/* Read-only AI pre-select — friendly tone copy */}
      <div
        data-testid="apply-readonly-md"
        className="rounded-lg bg-[#162035] border border-cyan-400/20 px-3 py-2 text-xs"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
          この知恵で参加します
        </p>
        <p className="mt-0.5 font-mono text-[#E2E8F0]">
          {selectedMd ? (
            <>
              {selectedMd.id}{" "}
              <span className="text-cyan-300">[{selectedMd.rank}]</span>
            </>
          ) : (
            <span className="text-slate-400">まだ知恵のカードがありません</span>
          )}
        </p>
        {preselect.reason && (
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
          aria-label="貸出中"
          data-testid="apply-cta-plugged-in"
          className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 bg-emerald-500/10 ring-1 ring-emerald-400/40 text-emerald-300 rounded-full text-sm font-semibold"
        >
          <CheckCircle2 aria-hidden className="w-4 h-4 stroke-emerald-300" />
          貸出中（参加中）
        </button>
      ) : (
        <button
          onClick={handleApply}
          disabled={!selectedMdId || applying || underwater}
          aria-label="この知恵を貸す"
          data-testid="apply-cta-engage"
          className="w-full px-4 py-3 bg-[#22D3EE] text-[#0B1121] font-bold rounded-full disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] hover:shadow-[0_0_0_2px_rgba(34,211,238,0.4),0_0_18px_rgba(34,211,238,0.25)] active:shadow-inner outline-none focus:outline focus:outline-2 focus:outline-cyan-400 inline-flex items-center justify-center gap-2"
        >
          <Plug aria-hidden className="w-4 h-4 stroke-[#0B1121]" />
          {applying ? "参加中..." : "この知恵を貸す（参加する）"}
        </button>
      )}

      {!pluggedIn && (
        <p className="text-center text-[11px] text-slate-300">
          あなたの知恵が、企業のお困りごとを助けます
        </p>
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
