// Global IP Protection — Black-box Execution Mode
// Three visibility levels: open (default) | api-only | blackbox
// Blackbox: GET excludes mdBody/source; only POST execution permitted.

export type VisibilityMode = "open" | "api-only" | "blackbox";

export interface BlackboxOptions {
  enabledAt?: string;
  reason?: string;
}

export interface VisibilityRecord {
  mode: VisibilityMode;
  guildId: string;
  updatedAt: string;
  options?: BlackboxOptions;
}

// ─── In-memory store (replace with DB in production) ─────────────────────────

const _store = new Map<string, VisibilityRecord>();

// ─── Core API ─────────────────────────────────────────────────────────────────

export function setVisibility(
  guildId: string,
  mode: VisibilityMode,
  options?: BlackboxOptions,
): VisibilityRecord {
  const record: VisibilityRecord = {
    mode,
    guildId,
    updatedAt: new Date().toISOString(),
    options,
  };
  _store.set(guildId, record);
  return record;
}

export function enableBlackbox(guildId: string, options?: BlackboxOptions): VisibilityRecord {
  return setVisibility(guildId, "blackbox", {
    enabledAt: new Date().toISOString(),
    ...options,
  });
}

export function getVisibility(guildId: string): VisibilityMode {
  return _store.get(guildId)?.mode ?? "open";
}

export function getVisibilityRecord(guildId: string): VisibilityRecord | null {
  return _store.get(guildId) ?? null;
}

// ─── Response filtering ───────────────────────────────────────────────────────

/** Remove mdBody + source from response when visibility is "blackbox" */
export function filterGetResponse<T extends Record<string, unknown>>(
  guildId: string,
  data: T,
): Record<string, unknown> {
  const mode = getVisibility(guildId);
  if (mode !== "blackbox") return data;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mdBody: _mb, source: _s, body: _b, content: _c, ...rest } = data;
  return rest;
}

/** Whether GET body content is accessible */
export function isBodyVisible(guildId: string): boolean {
  return getVisibility(guildId) === "open";
}

/** Whether POST execution is permitted (always true — even blackbox allows execution) */
export function isExecutionAllowed(_guildId: string): boolean {
  return true;
}

// ─── Mode metadata for UI ─────────────────────────────────────────────────────

export interface VisibilityModeInfo {
  mode: VisibilityMode;
  label: string;
  description: string;
  badge?: string;
}

export const VISIBILITY_MODES: VisibilityModeInfo[] = [
  {
    mode: "open",
    label: "フルオープン（学習可）",
    description: "MDの本文を公開。AIが自由に学習・引用できます。",
  },
  {
    mode: "api-only",
    label: "API のみ（学習不可）",
    description: "実行は可能ですが、MDの本文は非公開。スクレイピング不可。",
  },
  {
    mode: "blackbox",
    label: "Blackbox（実行専用）",
    description: "コードは見せない、結果だけ売る。海外スクレイピング対策済み。",
    badge: "🛡 海外スクレイピング対策済み",
  },
];

// ─── Test helper ──────────────────────────────────────────────────────────────

export function _resetBlackbox(): void {
  _store.clear();
}
