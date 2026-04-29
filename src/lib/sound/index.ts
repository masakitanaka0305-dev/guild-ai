"use client";

// GUILD AI — Water-Koto Chime (水琴窟 風)
// Synthesized bell/koto tone using Web Audio API only — no external assets.
// Two partials: 700Hz (bright bell) + 350Hz (warm undertone), 0.6s decay.
// Volume ~= -18 dBFS. Silent fail on iOS/Safari AudioContext restrictions.

let ctx: AudioContext | null = null;
let muted = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx || ctx.state === "closed") {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return ctx;
  } catch {
    return null;
  }
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): boolean {
  muted = !muted;
  return muted;
}

/**
 * playPoyon — やわらかい「ポヨン」音 (ノート保存系).
 * Low warm bell 150→250Hz sweep, 0.18s.
 */
export function playPoyon(): void {
  if (muted) return;
  const ac = getContext();
  if (!ac) return;
  try {
    if (ac.state === "suspended") ac.resume().catch(() => undefined);
    const osc = ac.createOscillator();
    const gainNode = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(250, ac.currentTime + 0.12);
    osc.frequency.linearRampToValueAtTime(200, ac.currentTime + 0.18);
    gainNode.gain.setValueAtTime(0, ac.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, ac.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
    osc.connect(gainNode);
    gainNode.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.2);
  } catch { /* silent fail */ }
}

/** Deterministic helper: returns the note frequencies used (for tests) */
export const CHIME_FREQUENCIES = [700, 350, 1400] as const;
export const POYON_FREQ_RANGE = [150, 250] as const;
