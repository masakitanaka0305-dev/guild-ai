import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("Reviewer / business-leads contrast", () => {
  it("`/business/checkout` form inputs sit on #162035 with #E2E8F0 text", () => {
    const src = readFileSync(
      join(ROOT, "src/app/business/checkout/page.tsx"),
      "utf-8",
    );
    expect(src).toContain("bg-midnight-surface");
    expect(src).toContain("text-text-primary");
    // Selected plan tile keeps the deep-sea contrast (no nameraka red wash)
    expect(src).not.toContain("border-[var(--primary,#6366F1)] bg-red-50");
  });

  it("legacy nameraka color tokens are absent from src/ tsx files (kuroko / 9890A8 / 4A4464 / surface-inset / 3A3664)", () => {
    const offenders: string[] = [];
    for (const f of walk(join(ROOT, "src"))) {
      const c = readFileSync(f, "utf-8");
      if (
        /\btext-kuroko\b/.test(c) ||
        /\btext-\[#9890A8\]/.test(c) ||
        /\btext-\[#4A4464\]/.test(c) ||
        /\btext-\[#3A3664\]/.test(c) ||
        /\bbg-surface-inset\b/.test(c)
      ) {
        offenders.push(f);
      }
    }
    expect(
      offenders,
      `Legacy light-theme tokens linger in: ${offenders.join(", ")}`,
    ).toHaveLength(0);
  });
});
