"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-xs font-semibold px-4 py-2 rounded-lg border border-[var(--n-divider,rgba(0,0,0,0.12))] text-[var(--n-text,#1A1714)] hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors"
    >
      印刷 / PDF保存
    </button>
  );
}
