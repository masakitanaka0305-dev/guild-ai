// GUILD AI — shared motion primitives.
//
// `TAP_CLASS`        — canonical "press feedback" Tailwind triple
//                      (scale 0.98 on press, strict reduced-motion guard).
// `RIPPLE_CLASS`     — Mercari Lightness Final Polish (#127) ripple chip:
//                      a soft brand-purple glow that scales 0.95→1.05 in
//                      220ms then fades. Animation is opt-in via the
//                      `motion-safe:` prefix so reduced-motion users
//                      see only a fade. Pair with `useRipple()` to spawn
//                      the ripple span on click.

"use client";

import { useCallback, useRef } from "react";

export const TAP_CLASS =
  "transition-transform duration-100 ease-out " +
  "active:scale-[0.98] motion-reduce:active:scale-100";

/** Per-context vibration patterns, mirrored in useTactile. */
export const TAP_VIBRATION_MS = 10;

/** Tailwind class string used by useRipple to render the ripple span. */
export const RIPPLE_CLASS =
  "pointer-events-none absolute inset-0 rounded-[inherit] " +
  "bg-brand-primary/20 motion-safe:animate-purple-ripple " +
  "motion-reduce:opacity-0 motion-reduce:transition-opacity " +
  "motion-reduce:duration-200";

/**
 * useRipple — spawn a brand-purple ripple span on press for any button.
 *
 * Usage:
 *   const { onPointerDown, ripples } = useRipple();
 *   <button className="relative overflow-hidden" onPointerDown={onPointerDown}>
 *     {label}
 *     {ripples}
 *   </button>
 *
 * The hook respects `data-anim="off"` on the document root (kill-switch)
 * and `prefers-reduced-motion` (renders the chip but immediately fades).
 */
export interface UseRippleOptions {
  /** Auto-cleanup delay in ms (default 360). */
  ttlMs?: number;
}

export interface UseRippleResult {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  ripples: React.ReactNode;
}

import { useState } from "react";

export function useRipple(opts: UseRippleOptions = {}): UseRippleResult {
  const ttl = opts.ttlMs ?? 360;
  const [chips, setChips] = useState<{ id: number }[]>([]);
  const idRef = useRef(0);

  const onPointerDown = useCallback(
    (_e: React.PointerEvent<HTMLElement>) => {
      if (typeof document !== "undefined" && document.documentElement.dataset.anim === "off") return;
      const id = ++idRef.current;
      setChips((cs) => [...cs, { id }]);
      window.setTimeout(() => {
        setChips((cs) => cs.filter((c) => c.id !== id));
      }, ttl);
    },
    [ttl],
  );

  // The ripple span is absolutely positioned over the button. The
  // consumer wraps the button with `relative overflow-hidden` so the
  // chip is clipped to the rounded corner.
  const ripples = (
    <>
      {chips.map((c) => (
        <span
          key={c.id}
          aria-hidden
          data-testid="purple-ripple"
          className={RIPPLE_CLASS}
        />
      ))}
    </>
  );

  return { onPointerDown, ripples };
}
