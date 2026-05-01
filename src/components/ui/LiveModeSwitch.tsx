"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { useLiveMode } from "@/hooks/useLiveMode";

/**
 * LiveModeSwitch (#129) — opt-in toggle for the high-cadence Coin Counter
 * mode. Lives in the global header next to the notification bell. Default
 * is OFF; one tap turns it ON, one tap turns it back OFF.
 *
 * a11y: `role="switch" aria-checked` + an explicit aria-label that
 * describes the consequence ("音と頻度が上がります"). Tab-reachable.
 *
 * On first OFF→ON activation the hook flags `firstActivation`, which we
 * surface as a one-shot inline toast right under the switch. The toast
 * is dismissable and the acknowledgement persists in localStorage, so
 * subsequent toggles don't re-show it.
 */
export function LiveModeSwitch({ className }: { className?: string }) {
  const { mode, toggle, firstActivation, acknowledgeFirstActivation } = useLiveMode();
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (firstActivation) setToastVisible(true);
  }, [firstActivation]);

  function dismissToast() {
    setToastVisible(false);
    acknowledgeFirstActivation();
  }

  const isOn = mode === "on";
  return (
    <div className={`relative inline-flex items-center ${className ?? ""}`}>
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        data-testid="live-mode-switch"
        data-live={isOn ? "on" : "off"}
        aria-label={
          isOn
            ? "Live モード ON。1 タップで OFF に戻せます（音と更新頻度を抑えます）"
            : "Live モード OFF。1 タップで ON にできます（音と更新頻度が上がります）"
        }
        onClick={toggle}
        className={[
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase",
          "border transition-colors",
          isOn
            ? "border-[var(--color-action-secondary)] text-[var(--color-action-secondary)] bg-[var(--color-action-secondary)]/10"
            : "border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-action-primary)]/60",
          "focus:outline focus:outline-2 focus:outline-[var(--color-action-primary)] focus:outline-offset-2",
        ].join(" ")}
      >
        <Activity
          aria-hidden
          className={`w-3 h-3 ${
            isOn ? "stroke-[var(--color-action-secondary)] motion-safe:animate-pulse motion-reduce:animate-none" : ""
          }`}
        />
        Live
      </button>

      {toastVisible && (
        <div
          data-testid="live-mode-first-toast"
          role="status"
          aria-live="polite"
          className="absolute right-0 top-full mt-2 w-[260px] rounded-xl shadow-brand-glow border border-[var(--color-action-primary)]/30 bg-[var(--color-bg-surface)] p-3 text-xs text-[var(--color-text-primary)] z-50"
        >
          <p className="leading-relaxed">
            <span className="font-bold text-[var(--color-action-secondary)]">Live モード</span>
            になりました。音と更新頻度が上がります。いつでも OFF にできます。
          </p>
          <button
            type="button"
            onClick={dismissToast}
            className="mt-2 inline-flex items-center text-[10px] font-bold text-[var(--color-action-primary)] underline-offset-4 hover:underline focus:outline focus:outline-2 focus:outline-[var(--color-action-primary)]"
          >
            わかりました
          </button>
        </div>
      )}
    </div>
  );
}
