// GUILD AI — role color tokens (#123)
//
// Three roles are explicitly addressed:
//   Dev    → cyan-400  (#22D3EE)
//   Design → violet-400 (#A78BFA)
//   PM     → yellow-300 (#FDE047)
//
// "Cross-functional" is the explicit fourth tag — used for assets that
// span more than one role and rendered with a cyan/violet split dot.
//
// These tokens mirror the entries in tailwind.config.ts so callers can
// reach them from runtime code without depending on Tailwind's runtime
// CSS variable plumbing.

export type AssetRoleType = "Dev" | "Design" | "PM" | "Cross-functional";

export const ROLE_COLOR: Record<AssetRoleType, string> = {
  Dev:               "#22D3EE",
  Design:            "#A78BFA",
  PM:                "#FDE047",
  // Visual: cyan dominant for cross-functional, paired with violet via
  // a split-fill dot in the consuming component.
  "Cross-functional": "#22D3EE",
};

export const ROLE_LABEL: Record<AssetRoleType, string> = {
  Dev:               "Dev",
  Design:            "Design",
  PM:                "PM",
  "Cross-functional": "Cross-functional",
};

/** Tailwind text-color utilities matching ROLE_COLOR. */
export const ROLE_TEXT_CLASS: Record<AssetRoleType, string> = {
  Dev:               "text-cyan-400",
  Design:            "text-violet-400",
  PM:                "text-yellow-300",
  "Cross-functional": "text-cyan-300",
};

/** Tailwind ring-color utilities for the Type pill border. */
export const ROLE_RING_CLASS: Record<AssetRoleType, string> = {
  Dev:               "ring-cyan-400/30",
  Design:            "ring-violet-400/30",
  PM:                "ring-yellow-300/30",
  "Cross-functional": "ring-cyan-400/30",
};

/** Tailwind background-tint utilities for the Type pill body. */
export const ROLE_BG_CLASS: Record<AssetRoleType, string> = {
  Dev:               "bg-cyan-400/10",
  Design:            "bg-violet-400/10",
  PM:                "bg-yellow-300/10",
  "Cross-functional": "bg-cyan-400/10",
};
