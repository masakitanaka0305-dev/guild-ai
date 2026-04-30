// Consent Log — append-only record of user agreement to terms

export interface ConsentRecord {
  handle: string;
  version: string;  // terms version, e.g. "2026-04"
  agreedAt: string; // ISO8601
  ip: string;       // "-" in browser context (no server-side IP)
}

const records: ConsentRecord[] = [];

export function recordConsent(
  handle: string,
  version: string,
  ts: string = new Date().toISOString(),
  ip: string = "-",
): ConsentRecord {
  const rec: ConsentRecord = { handle, version, agreedAt: ts, ip };
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
