// ─── Smart name split — heuristics for OAuth pre-fill ───────────────
//
// Confirmation is the goal of onboarding, not data entry. This helper
// turns a single OAuth-provided full name into two pre-filled fields.
//
// Rules:
//   • If the name contains an ASCII or full-width space → split there.
//   • If a Japanese name has no separator → first 2 chars are family,
//     remainder is given. (Most common JP family-name length.)
//   • For Latin names without a space → fall back to {familyName: name,
//     givenName: ""}. Operators can correct the rare case manually.

export interface NameParts {
  familyName: string;
  givenName: string;
}

const JP_RE = /[぀-ヿ一-鿿]/;

export function splitJapaneseName(fullName: string): NameParts {
  const trimmed = fullName.trim();
  if (!trimmed) return { familyName: "", givenName: "" };

  // Split on any ASCII or full-width whitespace.
  const parts = trimmed.split(/[\s　]+/);
  if (parts.length >= 2) {
    return { familyName: parts[0], givenName: parts.slice(1).join(" ") };
  }

  // Single token. If it looks Japanese, treat first 2 chars as family.
  if (JP_RE.test(trimmed) && trimmed.length >= 2) {
    return {
      familyName: trimmed.slice(0, 2),
      givenName: trimmed.slice(2),
    };
  }

  // Single Latin token: keep as family, leave given blank for review.
  return { familyName: trimmed, givenName: "" };
}
