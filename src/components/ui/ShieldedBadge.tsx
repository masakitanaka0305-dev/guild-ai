// GUILD AI — Shielded Badge (#123)
//
// Friendly-tone wrapping of the existing X-Robots-Tag noindex/nofollow
// stance. Surfaces on /mint after the 4-step pipeline lands.

import { Shield } from "lucide-react";

export function ShieldedBadge() {
  return (
    <p
      data-testid="shielded-badge"
      role="status"
      aria-label="大手 AI のクローラから守られています"
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 px-3 py-1 text-xs font-bold"
    >
      <Shield aria-hidden className="w-3.5 h-3.5 stroke-emerald-300" />
      🛡 大手 AI のクローラから守られています
    </p>
  );
}
