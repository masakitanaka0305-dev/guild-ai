"use client";

import { useEffect, useRef } from "react";

interface ComingSoonModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional override for the headline. Defaults to "Coming Soon". */
  title?: string;
  /** Optional override for the body copy. */
  body?: string;
}

/**
 * Reusable Coming Soon modal — surfaces when a feature link points at a
 * route that is wired up but not yet implemented for the current asset.
 *
 * - role="dialog" + aria-modal
 * - Esc closes
 * - Backdrop click closes
 * - Initial focus lands on the close button
 */
export function ComingSoonModal({
  open,
  onClose,
  title = "Coming Soon",
  body = "この詳細ページは MVP 後リリース予定です。",
}: ComingSoonModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="coming-soon-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-heading"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="bg-midnight-surface rounded-2xl shadow-xl p-6 w-full max-w-md border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="coming-soon-heading" className="text-white font-bold text-lg">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          {body}
        </p>
        <div className="mt-5 flex justify-end">
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="rounded-full bg-brand-primary px-5 py-2 text-xs font-bold text-text-on-primary hover:bg-brand-primary focus:outline focus:outline-2 focus:outline-brand-primary"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
