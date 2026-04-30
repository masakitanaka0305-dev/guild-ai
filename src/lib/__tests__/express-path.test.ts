// GUILD AI — Express Path Tests
// 6 tests: express-path(3) + timer-bar(1) + metrics(1) + jargon-lint(1)

import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

// ─── Express Path ────────────────────────────────────────────────────────────

import {
  EXPRESS_STEPS,
  BUDGET_MS,
  simulateExpressTimeline,
  getFirstRoyaltyJpy,
  FIRST_ROYALTY_JPY,
} from "@/lib/express-path";

describe("express-path: simulateExpressTimeline", () => {
  it("has exactly 7 steps with correct IDs", () => {
    expect(EXPRESS_STEPS).toHaveLength(7);
    const ids = EXPRESS_STEPS.map((s) => s.id);
    expect(ids).toEqual([
      "connect", "select-repo", "analyze", "validate",
      "publish", "first-royalty", "confirmed",
    ]);
  });

  it("total simulated duration < 180,000ms for any seed (100 seeds)", () => {
    for (let i = 0; i < 100; i++) {
      const { totalSeconds } = simulateExpressTimeline(`seed_${i}`);
      expect(totalSeconds * 1000).toBeLessThan(BUDGET_MS);
    }
  });

  it("First Royalty amounts are S=¥420 A=¥180 B=¥60", () => {
    expect(getFirstRoyaltyJpy("S")).toBe(FIRST_ROYALTY_JPY.S);
    expect(getFirstRoyaltyJpy("A")).toBe(FIRST_ROYALTY_JPY.A);
    expect(getFirstRoyaltyJpy("B")).toBe(FIRST_ROYALTY_JPY.B);
    expect(FIRST_ROYALTY_JPY.S).toBe(420);
    expect(FIRST_ROYALTY_JPY.A).toBe(180);
    expect(FIRST_ROYALTY_JPY.B).toBe(60);
  });
});

// ─── Timer Bar (source-level check) ─────────────────────────────────────────

describe("timer-bar: onboarding page contains TimerBar logic", () => {
  const src = (() => {
    try {
      return readFileSync(
        resolve(process.cwd(), "src/app/onboarding/page.tsx"),
        "utf8",
      );
    } catch { return ""; }
  })();

  it("page contains TimerBar with red deadline marker and green achieved state", () => {
    expect(src).toContain("TimerBar");
    expect(src).toContain("bg-red-");   // red line/bar for over-budget
    expect(src).toContain("bg-green-"); // green fill for achieved
    expect(src).toContain("bg-blue-");  // blue base bar
  });
});

// ─── Metrics ─────────────────────────────────────────────────────────────────

import {
  recordExpressRun,
  getMedianRunSeconds,
  getP95RunSeconds,
  _resetMetrics,
} from "@/lib/metrics/express";

describe("express-metrics: recordExpressRun + median", () => {
  beforeEach(() => _resetMetrics());

  it("recordExpressRun stores run and getMedianRunSeconds returns correct median", () => {
    recordExpressRun("alice", 42);
    recordExpressRun("bob", 50);
    recordExpressRun("carol", 38);
    const median = getMedianRunSeconds();
    // sorted: [38, 42, 50] → median = 42
    expect(median).toBe(42);
    const p95 = getP95RunSeconds();
    expect(p95).toBeGreaterThanOrEqual(median);
  });
});

// ─── Jargon-lint: stealth/shadow terms absent from source ────────────────────

function collectTsx(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = join(dir, e.name);
      return e.isDirectory() ? collectTsx(full)
        : e.name.endsWith(".tsx") || e.name.endsWith(".ts") ? [full] : [];
    });
  } catch { return []; }
}

describe("jargon-lint: anti-detection terms absent from all source", () => {
  const root = process.cwd();
  const srcFiles = collectTsx(join(root, "src")).filter(
    (f) => !f.includes("__tests__") && !f.includes(".test."),
  );

  const STEALTH_TERMS = [
    "shadow-for-employer",
    "stealth-employer",
    "企業隠蔽",
    "会社にバレない",
  ];

  it("no stealth/shadow-employer terms in non-test source files", () => {
    const violations: string[] = [];
    for (const file of srcFiles) {
      const content = readFileSync(file, "utf8");
      for (const term of STEALTH_TERMS) {
        if (content.includes(term)) {
          violations.push(`${term} in ${file}`);
        }
      }
    }
    expect(violations, `Found: ${violations.join(", ")}`).toHaveLength(0);
  });
});
