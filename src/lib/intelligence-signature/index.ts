// GUILD AI — Intelligence Signature
//
// Appends a deterministic authenticity footer to every minted MD:
//
//   ---
//   Intelligence Signature: <hash> | <iso8601>
//
// `hash` is a djb2 hex over the MD body + author handle so the same
// (text, author) always yields the same signature — useful for the
// "真正性証明" surface on /asset/[id]/report.

const FOOTER_DIVIDER = "\n\n---\nIntelligence Signature:";

export interface SignedMd {
  hash: string;
  /** ISO-8601 UTC timestamp of the signing call. */
  timestamp: string;
  /** The full MD body with the signature footer appended. */
  signature: string;
}

/**
 * djb2 hash → 8-char zero-padded hex. Deterministic, no crypto.
 * Sufficient for non-security display ID (true tamper-evidence
 * goes through `recipe-gate` + chain notarisation, not this footer).
 */
export function djb2Hex(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Builds the human-readable signature line (no body prefix). */
export function buildSignatureLine(hash: string, timestamp: string): string {
  return `Intelligence Signature: ${hash} | ${timestamp}`;
}

/** True when the input MD already carries a signature footer. */
export function hasSignature(mdText: string): boolean {
  return /\n---\nIntelligence Signature:\s+[0-9a-f]{8}\s+\|\s+[^\n]+/.test(mdText);
}

export interface SignOptions {
  /** Override timestamp — defaults to the current UTC time. */
  now?: () => Date;
}

/**
 * Returns the MD with an appended Intelligence Signature footer.
 * The hash is over `${mdText}::${authorHandle}` so authorship binds
 * into the digest.
 *
 * Idempotent: if the input already carries a signature it is returned
 * as-is and the existing hash is parsed back out.
 */
export function signMd(
  mdText: string,
  authorHandle: string,
  opts: SignOptions = {},
): SignedMd {
  if (hasSignature(mdText)) {
    const m = /Intelligence Signature:\s+([0-9a-f]{8})\s+\|\s+([^\n]+)/.exec(mdText);
    if (m) {
      return { hash: m[1], timestamp: m[2].trim(), signature: mdText };
    }
  }
  const hash = djb2Hex(`${mdText}::${authorHandle}`);
  const timestamp = (opts.now?.() ?? new Date()).toISOString();
  const signature = `${mdText.trimEnd()}${FOOTER_DIVIDER} ${hash} | ${timestamp}\n`;
  return { hash, timestamp, signature };
}
