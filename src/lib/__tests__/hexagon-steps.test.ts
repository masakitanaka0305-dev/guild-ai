import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("HexagonSteps — onboarding progress strip", () => {
  const src = readFileSync(
    join(ROOT, "src/components/ui/HexagonSteps.tsx"),
    "utf-8",
  );

  it("encodes three states (complete / active / pending) with distinct fill, stroke and label", () => {
    // complete → cyan fill + ✓ on deep-sea ink
    expect(src).toMatch(/state\s*===\s*"complete"\s*\?\s*"#6366F1"/);
    expect(src).toMatch(/state\s*===\s*"complete"\s*\?\s*"#0B1121"/);
    expect(src).toMatch(/"complete"\s*\?\s*"✓"/);

    // active → surface-2 fill + cyan stroke + cyan number
    expect(src).toMatch(/"active"\s+\?\s*"#1E293B"/);
    // pending fall-through fill is the deep surface, stroke is muted
    expect(src).toContain('"#162035"');
    expect(src).toContain("#94A3B8");
    // 「未着手」 a11y label confirms the three-state model
    expect(src).toContain("未着手");
  });

  it("emits aria-current=\"step\" on the active hex and aria-label on every hex", () => {
    expect(src).toMatch(/aria-current=\{ariaCurrent\}/);
    expect(src).toMatch(/state\s*===\s*"active"\s*\?\s*"step"/);
    expect(src).toMatch(/ariaLabel=\{ariaLabel\}/);
    expect(src).toContain("完了");
    expect(src).toContain("進行中");
    expect(src).toContain("未着手");
  });

  it("onboarding/page.tsx mounts HexagonSteps with the express-path total + label list", () => {
    const onboarding = readFileSync(
      join(ROOT, "src/app/onboarding/page.tsx"),
      "utf-8",
    );
    expect(onboarding).toContain('from "@/components/ui/HexagonSteps"');
    expect(onboarding).toContain("<HexagonSteps");
    expect(onboarding).toContain("EXPRESS_STEPS.length");
  });

  it("/onboarding completed step rows use bg-emerald-600/10 + cyan left border", () => {
    const onboarding = readFileSync(
      join(ROOT, "src/app/onboarding/page.tsx"),
      "utf-8",
    );
    expect(onboarding).toMatch(/bg-emerald-600\/10/);
    expect(onboarding).toMatch(/border-ai-action/);
  });
});
