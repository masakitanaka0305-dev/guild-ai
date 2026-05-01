// GUILD AI — Confidentiality Filter
//
// Masks personally-identifiable / commercially-sensitive fields in an MD
// before it is rendered for an enterprise preview surface. The result is
// always a string; the count of redactions is exposed so the caller can
// surface "N 件の機密情報をマスクしました" badges.
//
// Default policy is conservative: emails, phone numbers, individual
// people names (Japanese full-name patterns), and any token from the
// caller-supplied company-name dictionary.
//
// This is a *display* filter, not a data-loss-prevention boundary.
// It runs at render-time only.

const REDACTION = "[REDACTED]";

export interface MaskInput {
  /** Optional list of company / org names to redact verbatim. */
  companies?: readonly string[];
  /** Optional list of person names to redact verbatim. */
  persons?: readonly string[];
}

export interface MaskResult {
  text: string;
  redactionCount: number;
}

// Email — RFC-ish loose match. ASCII-only, sufficient for masking display.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Phone — Japanese (0X-XXXX-XXXX / 0X0-XXXX-XXXX) + generic E.164.
const PHONE_RE = /(?:\+\d{1,3}[ -]?)?(?:\d{2,4}[- ]?){2,3}\d{3,4}/g;

// Japanese full name — kanji surname (1-3) + space + kanji given (1-3).
// Conservative: requires the space so we don't strip generic kanji words.
const JP_FULL_NAME_RE = /[一-鿿]{1,3}[ 　][一-鿿]{1,3}/g;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Returns the MD with sensitive fields replaced by [REDACTED].
 * Caller-provided company / person dictionaries are matched verbatim.
 *
 * The function is pure — it never mutates inputs.
 */
export function maskForEnterprise(
  mdText: string,
  opts: MaskInput = {},
): MaskResult {
  let count = 0;
  let out = mdText;

  // Caller-provided dictionaries first, so company/person names that
  // happen to overlap email-like or phone-like spans win.
  for (const name of opts.companies ?? []) {
    const re = new RegExp(escapeRegExp(name), "g");
    out = out.replace(re, () => { count++; return REDACTION; });
  }
  for (const name of opts.persons ?? []) {
    const re = new RegExp(escapeRegExp(name), "g");
    out = out.replace(re, () => { count++; return REDACTION; });
  }

  out = out.replace(EMAIL_RE,        () => { count++; return REDACTION; });
  out = out.replace(PHONE_RE,        () => { count++; return REDACTION; });
  out = out.replace(JP_FULL_NAME_RE, () => { count++; return REDACTION; });

  return { text: out, redactionCount: count };
}

export const REDACTION_TOKEN = REDACTION;
