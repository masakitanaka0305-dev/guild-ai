import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getNextMilestone, getAllNextMilestones } from "@/lib/milestones";
import { demoUserHistory } from "@/lib/achievements";

const ROOT = process.cwd();

describe("Milestones (#130) — kinds + progress", () => {
  it("getAllNextMilestones returns one entry per kind that still has headroom", () => {
    const out = getAllNextMilestones(demoUserHistory());
    const kinds = new Set(out.map((m) => m.kind));
    // Demo state has not capped any track yet.
    expect(kinds).toEqual(
      new Set([
        "cumulative-royalty",
        "streak-days",
        "total-calls",
        "distinct-mds",
      ]),
    );
    // Every entry's progress fraction sits in [0, 1].
    for (const m of out) {
      expect(m.progressPercent).toBeGreaterThanOrEqual(0);
      expect(m.progressPercent).toBeLessThanOrEqual(1);
      expect(m.remainingCopy).toContain("あと");
      expect(m.remainingCopy).toContain("で ");
    }
  });

  it("getNextMilestone picks the highest-progress kind deterministically", () => {
    // Demo: royalty 24,800 → next 100,000 (~25%); streak 4 → 7 (~57%);
    // calls 4,220 → 10,000 (~42%); MDs 12 → 30 (~40%).
    // → streak-days wins.
    const m = getNextMilestone(demoUserHistory());
    expect(m).not.toBeNull();
    expect(m!.kind).toBe("streak-days");
    expect(m!.targetValue).toBe(7);
    expect(m!.remainingCopy).toContain("あと 3 日");
    expect(m!.remainingCopy).toContain("連続 7 日達成");
  });

  it("milestone progress fractions are anchored to actual values, not extrapolated", () => {
    const h = demoUserHistory();
    const yen = getAllNextMilestones(h).find((m) => m.kind === "cumulative-royalty")!;
    expect(yen.currentValue).toBe(h.royaltyTotalJpy);
    // Demo royalty 24,800 → next tier 100,000.
    expect(yen.targetValue).toBe(100_000);
    expect(yen.remainingCopy).toContain("あと ¥75,200");
    // Strict no-FOMO copy.
    expect(yen.remainingCopy).not.toMatch(/急騰|暴落|％\s*上昇/);
  });
});

describe("NextMilestoneCard — UI mount on /guild", () => {
  const card = readFileSync(
    join(ROOT, "src/components/NextMilestoneCard.tsx"),
    "utf-8",
  );
  const guild = readFileSync(join(ROOT, "src/app/guild/page.tsx"), "utf-8");

  it("renders progressbar + badge preview + wall link", () => {
    expect(card).toContain('data-testid="next-milestone-card"');
    expect(card).toContain('data-testid="next-milestone-bar"');
    expect(card).toContain('role="progressbar"');
    expect(card).toContain('data-testid="next-milestone-badge-preview"');
    expect(card).toContain('href="/profile/achievements"');
    expect(card).toContain("次のマイルストーン");
  });

  it("/guild mounts the NextMilestoneCard above the CoinCounter", () => {
    expect(guild).toContain('import { NextMilestoneCard }');
    expect(guild).toMatch(/<NextMilestoneCard\s+history=\{demoUserHistory\(\)\}\s*\/>[\s\S]*<CoinCounter/);
  });
});
