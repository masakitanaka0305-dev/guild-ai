import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BADGES,
  TOTAL_BADGES,
  BADGE_AXIS_LABEL,
  buildShareText,
  evaluateUnlocks,
  demoUserHistory,
} from "@/lib/achievements";

const ROOT = process.cwd();

describe("Achievement Wall (#130) — catalogue + evaluation", () => {
  it("ships exactly 30 badges across the five healthy-excitement axes", () => {
    expect(TOTAL_BADGES).toBe(30);
    expect(BADGES).toHaveLength(30);
    const axes = new Set(BADGES.map((b) => b.axis));
    expect(axes).toEqual(new Set(["achievement", "anticipation", "belonging", "discovery", "mastery"]));
    expect(BADGE_AXIS_LABEL.achievement).toBe("達成");
    expect(BADGE_AXIS_LABEL.anticipation).toBe("期待");
    expect(BADGE_AXIS_LABEL.belonging).toBe("所属");
    expect(BADGE_AXIS_LABEL.discovery).toBe("発見");
    expect(BADGE_AXIS_LABEL.mastery).toBe("上達");
  });

  it("badge ids are unique and every badge has a non-empty criteria string", () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of BADGES) {
      expect(b.criteria.length).toBeGreaterThan(0);
      expect(b.icon.length).toBeGreaterThan(0);
      expect(["bronze", "silver", "gold", "legend"]).toContain(b.rank);
    }
  });

  it("evaluateUnlocks is deterministic and the demo history unlocks 8–18 badges", () => {
    const a = evaluateUnlocks(demoUserHistory());
    const b = evaluateUnlocks(demoUserHistory());
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    expect(a.length).toBeGreaterThanOrEqual(8);
    expect(a.length).toBeLessThanOrEqual(18);
    // Sanity: the demo always lands the entry-level badges.
    const ids = new Set(a.map((b2) => b2.id));
    expect(ids.has("first-mint")).toBe(true);
    expect(ids.has("bronze-forge")).toBe(true);
    expect(ids.has("silver-crafter")).toBe(true);
    expect(ids.has("gold-master")).toBe(true);
  });

  it("evaluateUnlocks reacts strictly to threshold crossings", () => {
    const base = demoUserHistory();
    const ids = (h = base) => new Set(evaluateUnlocks(h).map((b) => b.id));

    // 7-day royalty needs 7+ days; demo has 4.
    expect(ids().has("royalty-streak-7")).toBe(false);
    expect(ids({ ...base, royaltyStreakDays: 7 }).has("royalty-streak-7")).toBe(true);

    // ¥10,000 milestone is unlocked at 10,000+; demo has 24,800.
    expect(ids().has("yen-10k-milestone")).toBe(true);
    expect(ids({ ...base, royaltyTotalJpy: 9_999 }).has("yen-10k-milestone")).toBe(false);

    // 1,000-call 24h is legend-tier and stays locked at demo's 132 calls.
    expect(ids().has("calls-1000-24h")).toBe(false);
    expect(ids({ ...base, callsLast24h: 1_500 }).has("calls-1000-24h")).toBe(true);
  });

  it("share text names the badge + handle and stays jargon-clean (no FOMO)", () => {
    const badge = BADGES.find((b) => b.id === "first-mint")!;
    const text = buildShareText("demo-user", badge);
    expect(text).toContain("@demo-user");
    expect(text).toContain("First Mint");
    expect(text).toContain("知恵を資産に");
    expect(text).not.toMatch(/急騰|暴落|％\s*上昇/);
  });
});

describe("Achievement Wall — UI surface", () => {
  const grid = readFileSync(
    join(ROOT, "src/components/achievements/AchievementGrid.tsx"),
    "utf-8",
  );
  const page = readFileSync(
    join(ROOT, "src/app/profile/achievements/page.tsx"),
    "utf-8",
  );

  it("AchievementGrid renders role=img tiles + locked vs unlocked branches", () => {
    expect(grid).toContain('data-testid="achievement-grid"');
    expect(grid).toContain('data-testid="achievement-tile"');
    expect(grid).toMatch(/role="img"/);
    expect(grid).toContain('data-locked={isUnlocked ? "false" : "true"}');
    expect(grid).toContain("あと N 件で解放");
    expect(grid).toContain('data-testid="achievement-share"');
  });

  it("share modal exposes copy / Threads / X targets with brand-primary X CTA", () => {
    expect(grid).toContain('data-testid="achievement-share-modal"');
    expect(grid).toContain('data-testid="achievement-share-copy"');
    expect(grid).toContain('data-testid="achievement-share-threads"');
    expect(grid).toContain('data-testid="achievement-share-x"');
    expect(grid).toMatch(/bg-brand-primary[^"]*hover:bg-brand-primary-hover/);
    expect(grid).toMatch(/role="dialog"/);
  });

  it("/profile/achievements page mounts the grid + back link", () => {
    expect(page).toContain('data-testid="achievements-page"');
    expect(page).toContain("AchievementGrid");
    expect(page).toContain("プロフィールに戻る");
  });
});
