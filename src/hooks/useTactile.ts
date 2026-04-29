"use client";

import { useCallback } from "react";
import { playPoyon, isMuted } from "@/lib/sound";

export type TactileContext = "stamp" | "poyon" | "coin" | "quest";

const VIBRATION_MS: Record<TactileContext, number[]> = {
  stamp: [15],
  poyon: [8],
  coin:  [10, 5, 10],
  quest: [12],
};

function vibrate(pattern: number[]) {
  if (typeof window === "undefined") return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  try {
    navigator.vibrate?.(pattern);
  } catch { /* unsupported */ }
}

export function useTactile(context: TactileContext = "poyon") {
  const trigger = useCallback(() => {
    if (!isMuted()) {
      playPoyon();
    }
    vibrate(VIBRATION_MS[context]);
  }, [context]);

  return trigger;
}
