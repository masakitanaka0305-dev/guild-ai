"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useLiveMode (#129) — opt-in "Live" cadence for the /guild knowledge-bank
 * counter. OFF by default; persists through localStorage so the user
 * decision is sticky.
 *
 * Surface contract:
 *   off  → CoinCounter ticks 3–5s, no sound (default)
 *   on   → CoinCounter ticks every 2s, soft chime per tick, "LIVE" pill
 *
 * Switching ON the first time also flags `firstActivation` so the host
 * UI can show a one-shot toast explaining the consequences (audio +
 * higher cadence) and how to switch back. The flag clears on the next
 * read so it is genuinely once-only.
 */
const STORAGE_KEY = "coinLiveMode";
const FIRST_ON_KEY = "coinLiveMode:firstSeen";

export type LiveMode = "on" | "off";

export interface UseLiveModeResult {
  mode: LiveMode;
  /** Flips OFF→ON or ON→OFF. */
  toggle: () => void;
  /** True the *first* time the user has flipped to ON in this device.
   *  After the host acknowledges it (e.g. shows a toast) the flag stays
   *  cleared. */
  firstActivation: boolean;
  /** Marks the first-activation toast as acknowledged. */
  acknowledgeFirstActivation: () => void;
}

function readMode(): LiveMode {
  if (typeof window === "undefined") return "off";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "on" ? "on" : "off";
  } catch {
    return "off";
  }
}

function readFirstSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FIRST_ON_KEY) === "1";
  } catch {
    return false;
  }
}

export function useLiveMode(): UseLiveModeResult {
  // SSR-safe: always start as "off" on the server, then sync from
  // localStorage on the client after hydration.
  const [mode, setMode] = useState<LiveMode>("off");
  const [firstActivation, setFirstActivation] = useState(false);

  useEffect(() => {
    setMode(readMode());
  }, []);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next: LiveMode = prev === "on" ? "off" : "on";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch { /* storage blocked */ }
      // Trigger the one-shot toast only when crossing OFF → ON for the
      // first time on this device.
      if (next === "on" && !readFirstSeen()) {
        setFirstActivation(true);
      }
      return next;
    });
  }, []);

  const acknowledgeFirstActivation = useCallback(() => {
    setFirstActivation(false);
    try {
      window.localStorage.setItem(FIRST_ON_KEY, "1");
    } catch { /* storage blocked */ }
  }, []);

  return { mode, toggle, firstActivation, acknowledgeFirstActivation };
}

export const LIVE_MODE_STORAGE_KEY = STORAGE_KEY;
export const LIVE_MODE_FIRST_SEEN_KEY = FIRST_ON_KEY;
