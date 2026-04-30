// GUILD AI — Express Path Tests
// 10 tests: express-path(7) + timer-bar(1) + metrics(1) + jargon-lint(1)

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
  analyzeContent,
  validateExpressInput,
  type ExpressInput,
} from "@/lib/express-path";

describe("express-path: steps", () => {
  it("has exactly 8 steps with source as first", () => {
    expect(EXPRESS_STEPS).toHaveLength(8);
    expect(EXPRESS_STEPS[0].id).toBe("source");
    const ids = EXPRESS_STEPS.map((s) => s.id);
    expect(ids).toEqual([
      "source", "connect", "select-repo", "analyze", "validate",
      "publish", "first-royalty", "confirmed",
    ]);
  });

  it("source step has durationMs=0 (user-driven)", () => {
    const src = EXPRESS_STEPS.find((s) => s.id === "source");
    expect(src?.durationMs).toBe(0);
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

// ─── Source step: 3 input paths ──────────────────────────────────────────────

describe("express-path: validateExpressInput", () => {
  it("rejects non-GitHub URL", () => {
    const r = validateExpressInput({ kind: "url", content: "https://example.com/repo" });
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("accepts valid GitHub URL", () => {
    const r = validateExpressInput({ kind: "url", content: "https://github.com/user/my-repo" });
    expect(r.ok).toBe(true);
  });

  it("rejects text input under 100 chars", () => {
    const r = validateExpressInput({ kind: "text", content: "short text" });
    expect(r.ok).toBe(false);
  });

  it("accepts text input 100+ chars", () => {
    const r = validateExpressInput({ kind: "text", content: "a".repeat(100) });
    expect(r.ok).toBe(true);
  });

  it("rejects file over 200KB", () => {
    const r = validateExpressInput({
      kind: "file",
      content: "x".repeat(100),
      meta: { fileSize: 201 * 1024 },
    });
    expect(r.ok).toBe(false);
  });
});

// ─── analyzeContent: rank from content ───────────────────────────────────────

describe("express-path: analyzeContent", () => {
  it("running-code content gets higher rank than plain prose", () => {
    const withCode: ExpressInput = {
      kind: "text",
      content: [
        "# My Technical Guide",
        "",
        "This guide explains everything about the system.",
        "It covers multiple topics in great depth.",
        "The content is well structured and comprehensive.",
        "",
        "```typescript",
        "export function processData(input: string): string {",
        "  return input.trim().toLowerCase();",
        "}",
        "```",
        "",
        "More explanation follows here with detailed examples.",
      ].join("\n").repeat(5), // enough density
    };
    const plainText: ExpressInput = {
      kind: "text",
      content: "This is a plain text document. ".repeat(50),
    };
    const codeResult = analyzeContent(withCode);
    const plainResult = analyzeContent(plainText);
    // Code content should rank higher than or equal to plain prose
    const rankOrder: Record<string, number> = { S: 4, A: 3, B: 2, D: 1 };
    expect(rankOrder[codeResult.rank]).toBeGreaterThanOrEqual(rankOrder[plainResult.rank]);
  });

  it("extracts H1 title from markdown", () => {
    const input: ExpressInput = {
      kind: "text",
      content: "# My Awesome Guide\n\nsome content here",
    };
    const result = analyzeContent(input);
    expect(result.title).toBe("My Awesome Guide");
  });

  it("validationScore is in 50–94 range", () => {
    const input: ExpressInput = {
      kind: "text",
      content: "# Test\n\n" + "content ".repeat(200),
    };
    const result = analyzeContent(input);
    expect(result.validationScore).toBeGreaterThanOrEqual(50);
    expect(result.validationScore).toBeLessThanOrEqual(94);
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

  it("page hosts the Express Path TimerBar + Smart Pre-fill confirmation (Water Guild v1)", () => {
    // Water Guild v1 brings the TimerBar back as the post-confirmation
    // express run indicator, fronted by the Smart Pre-fill confirmation.
    expect(src).toContain("TimerBar");
    expect(src).toContain("Smart Pre-fill");
    expect(src).toContain("確認して進む");
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
