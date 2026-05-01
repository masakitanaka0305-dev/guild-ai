// GUILD AI — Mercari Lightness (#126) K9
//
// Shared motion primitives for the friendly-tone surface.
// `TAP_CLASS` is the canonical "press feedback" Tailwind triple:
// scale 0.98 on press, with a strict reduced-motion guard. Use this
// on every major CTA so the entire app feels physically consistent.

export const TAP_CLASS =
  "transition-transform duration-100 ease-out " +
  "active:scale-[0.98] motion-reduce:active:scale-100";

/** Per-context vibration patterns, mirrored in useTactile. */
export const TAP_VIBRATION_MS = 10;
