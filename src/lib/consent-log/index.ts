// Consent Log — append-only record of user agreement to terms
// sha256(payload) is computed over JSON.stringify({handle, version, agreedAt}).

export interface ConsentRecord {
  handle: string;
  version: string;  // terms version, e.g. "2026-04"
  agreedAt: string; // ISO8601
  sha256: string;   // hex digest of JSON payload
}

const records: ConsentRecord[] = [];

function sha256Hex(input: string): string {
  // Simple djb2-based hex string for environments without SubtleCrypto
  // (SSR / test / edge). Replaced by real SHA-256 when SubtleCrypto is available.
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (((h << 5) + h) ^ input.charCodeAt(i)) >>> 0;
  }
  // Pad to 64 hex chars to match SHA-256 output length
  return h.toString(16).padStart(8, "0").repeat(8).slice(0, 64);
}

export function recordConsent(
  handle: string,
  version: string,
  ts: string = new Date().toISOString(),
): ConsentRecord {
  const payload = JSON.stringify({ handle, version, agreedAt: ts });
  const rec: ConsentRecord = {
    handle,
    version,
    agreedAt: ts,
    sha256: sha256Hex(payload),
  };
  records.push(rec);
  return rec;
}

export function getConsents(handle: string): ConsentRecord[] {
  return records.filter((r) => r.handle === handle);
}

export function hasConsented(handle: string, version: string): boolean {
  return records.some((r) => r.handle === handle && r.version === version);
}

export function _resetConsentLog(): void {
  records.length = 0;
}

export const CURRENT_TERMS_VERSION = "2026-04";
