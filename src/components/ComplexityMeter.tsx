import { useId } from "react";

interface Props {
  score: number;
  label?: string;
  showTip?: boolean;
}

export function ComplexityMeter({ score, label, showTip = true }: Props) {
  const tipId = useId();
  const pct = Math.min(100, Math.max(0, score));
  const barColor =
    pct >= 80 ? "#D4AF37" :
    pct >= 60 ? "#0E9F4F" :
    "#9890A8";

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-1.5">
        <p className="text-[11px] font-semibold text-[var(--n-muted,#6B6456)] uppercase tracking-widest">
          Complexity Score
        </p>
        {showTip && (
          <span
            id={tipId}
            className="group relative"
          >
            <button
              type="button"
              aria-describedby={tipId}
              className="w-4 h-4 rounded-full bg-[var(--n-surface-2,#F5F3EE)] text-slate-400 text-[10px] font-bold flex items-center justify-center hover:bg-[var(--n-divider)] transition-colors"
            >
              ？
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-6 top-0 z-10 hidden group-hover:block w-56 rounded-xl bg-[#1A1714] text-white text-[11px] leading-snug px-3 py-2 shadow-lg"
            >
              過去の案件と運用中ノートの設計難度から算出しています（0–100）
            </span>
          </span>
        )}
        <span className="ml-auto text-sm font-bold tabular-nums text-[var(--n-text,#1A1714)]">
          {pct}
        </span>
      </div>

      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`Complexity Score ${pct} / 100`}
        className="relative h-2.5 rounded-full bg-[var(--n-surface-2,#F5F3EE)] overflow-hidden"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>

      {label && (
        <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-1">{label}</p>
      )}
    </div>
  );
}
