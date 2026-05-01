"use client";

import { useEffect, useState } from "react";

/**
 * usePrefersReducedMotion — hook around the
 * `(prefers-reduced-motion: reduce)` media query.
 *
 * Used by Cinematic Mint (#128) to short-circuit Phase 1–3 of the
 * reveal so users with vestibular or attention sensitivities see the
 * end-state in ≤ 0.5s. Safe in SSR — returns false until the effect
 * runs in the client and hydration completes.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const fn = () => setReduced(m.matches);
    m.addEventListener("change", fn);
    return () => m.removeEventListener("change", fn);
  }, []);
  return reduced;
}
