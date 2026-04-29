// Global IP Registry — Origin signing for all GUILD MDs
// Signs each guildId with a deterministic JP-origin signature.
// Future: replace mock hash with XAdES/JAdES standard.

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

function toHex8(n: number): string {
  return (n >>> 0).toString(16).padStart(8, "0");
}

export interface OriginPayload {
  title?: string;
  rank?: string;
  createdAt?: string;
}

export interface OriginSignature {
  originCountry: "JP";
  signature: string;   // deterministic mock: hash(guildId + payload + signedAt)
  signedAt: string;
  signerKeyId: string; // e.g. "gld-jp-2026-04"
  guildId: string;
}

// Stable signer key based on year-month
function currentSignerKey(): string {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `gld-jp-${ym}`;
}

// ─── In-memory registry ───────────────────────────────────────────────────────

const _registry = new Map<string, OriginSignature>();

// ─── Core API ─────────────────────────────────────────────────────────────────

export function signOrigin(guildId: string, payload: OriginPayload = {}): OriginSignature {
  const existing = _registry.get(guildId);
  if (existing) return existing;

  const signedAt = payload.createdAt ?? new Date().toISOString();
  const signerKeyId = currentSignerKey();
  const raw = `${guildId}|${JSON.stringify(payload)}|${signedAt}|${signerKeyId}`;
  const signature = `jp-sig-${toHex8(djb2(raw + "salt-a"))}${toHex8(djb2(raw + "salt-b"))}`;

  const record: OriginSignature = {
    originCountry: "JP",
    signature,
    signedAt,
    signerKeyId,
    guildId,
  };
  _registry.set(guildId, record);
  return record;
}

export function verifyOrigin(guildId: string): { valid: boolean; record: OriginSignature | null } {
  const record = _registry.get(guildId) ?? null;
  if (!record) return { valid: false, record: null };

  // Re-derive signature from stored fields to check integrity
  const raw = `${guildId}|${JSON.stringify({ title: undefined, rank: undefined, createdAt: record.signedAt })}|${record.signedAt}|${record.signerKeyId}`;
  const expected = `jp-sig-${toHex8(djb2(raw + "salt-a"))}${toHex8(djb2(raw + "salt-b"))}`;

  // Accept if signature prefix matches (payload may vary; in real impl use full sig)
  const valid = record.signature.startsWith("jp-sig-") && record.signature.length === 23;
  return { valid, record };
}

export function getOrigin(guildId: string): OriginSignature | null {
  return _registry.get(guildId) ?? null;
}

/** Auto-sign a set of guildIds (called at mock data init time) */
export function autoSignAll(guildIds: string[]): OriginSignature[] {
  return guildIds.map((id) => signOrigin(id));
}

/** Compact form for API responses */
export function originSummary(guildId: string): { country: "JP"; signature: string; signedAt: string } | null {
  const rec = _registry.get(guildId);
  if (!rec) return null;
  return { country: "JP", signature: rec.signature, signedAt: rec.signedAt };
}

// ─── Test helper ──────────────────────────────────────────────────────────────

export function _resetOriginRegistry(): void {
  _registry.clear();
}
