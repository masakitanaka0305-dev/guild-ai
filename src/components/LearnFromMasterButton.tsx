"use client";

import { useState } from "react";
import Link from "next/link";
import { getRecommendedNotes } from "@/lib/master-reputation";

interface Props {
  handle: string;
}

export function LearnFromMasterButton({ handle }: Props) {
  const [open, setOpen] = useState(false);
  const notes = getRecommendedNotes(handle);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full h-10 rounded-full bg-[var(--n-text,#1A1714)] text-[var(--n-gold,#D4AF37)] text-xs font-bold hover:opacity-90 active:scale-[0.97] transition-all"
      >
        この師に学ぶ
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`@${handle} の推薦ノート`}
        >
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
            <p className="font-bold text-[var(--n-text,#1A1714)] mb-1 text-center">
              @{handle} の推薦ノート
            </p>
            <p className="text-[10px] text-[var(--n-muted,#6B6456)] text-center mb-5">
              この師匠が選ぶ、学びの起点となる3つのノート
            </p>

            <ol className="space-y-2 mb-5">
              {notes.map((note, i) => (
                <li key={note.guildId}>
                  <Link
                    href={`/asset/${note.guildId}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--n-divider,rgba(0,0,0,0.08))] px-4 py-3 hover:border-[var(--primary,#6366F1)] hover:bg-red-50 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-[var(--n-surface-2,#F5F3EE)] flex items-center justify-center text-[10px] font-bold text-[var(--n-muted,#6B6456)] flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs font-semibold text-[var(--n-text,#1A1714)] flex-1">{note.title}</span>
                    <span className="text-[10px] text-[var(--n-muted,#6B6456)] font-mono">{note.guildId.slice(-8)}</span>
                  </Link>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full h-10 rounded-full border border-[var(--n-divider,rgba(0,0,0,0.08))] text-[var(--n-muted,#6B6456)] text-sm font-semibold hover:bg-[var(--n-surface-2,#F5F3EE)] transition-all"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
