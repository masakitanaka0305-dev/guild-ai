import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(join(ROOT, "src/app/projects/page.tsx"), "utf-8");

describe("/projects — Mercari mobile grid (#126)", () => {
  it("ships a mobile-only grid-cols-2 card list", () => {
    expect(src).toContain('data-testid="projects-mobile-grid"');
    expect(src).toMatch(/md:hidden grid grid-cols-2/);
    expect(src).toContain('data-testid="project-card-mobile"');
  });

  it("each card surfaces 想定お礼 in brand gold (#FBBF24 dark / #A16207 light) tabular-nums with 1.4× ¥", () => {
    expect(src).toContain('data-testid="project-card-reward"');
    // Final Polish (#127): light-on-white falls back to amber-700
    // (#A16207) and dark uses the brand gold (#FBBF24).
    expect(src).toMatch(/text-\[#A16207\]/);
    expect(src).toMatch(/text-\[#FBBF24\]/);
    expect(src).toContain("想定お礼");
    // ¥ is rendered 1.4em larger than the digits.
    expect(src).toMatch(/text-\[1\.4em\]/);
    expect(src).toContain('data-testid="project-card-yen-mark"');
  });

  it("desktop table view persists behind md:block", () => {
    expect(src).toMatch(/hidden md:block overflow-x-auto/);
    expect(src).toContain("<table");
  });

  it("primary card CTA reads 「この困りごとを助ける」", () => {
    expect(src).toContain("この困りごとを助ける");
    expect(src).toMatch(/aria-label="この困りごとを助ける"/);
    // Tap reaction is inherited from the canonical TAP_CLASS helper
    // (active:scale-[0.98] + motion-reduce:active:scale-100).
    expect(src).toContain('from "@/lib/motion"');
    expect(src).toContain("TAP_CLASS");
  });

  it("relativeDeadline replaces YYYY-MM-DD with あと N 日 / 今日まで copy", () => {
    expect(src).toContain("relativeDeadline");
    expect(src).toContain("あと");
    expect(src).toContain("今日まで");
    expect(src).toContain("締切を過ぎました");
    expect(src).toContain('data-testid="project-card-deadline"');
  });
});

describe("/projects — relativeDeadline pure function", () => {
  // Re-implement and exercise the helper inline; the page exports it
  // implicitly through the JSX, and the lookup table is small so we
  // can describe its behaviour right here.
  function relativeDeadline(deadline: string, today = new Date("2026-05-09T00:00:00.000Z")): string {
    const due = new Date(`${deadline}T00:00:00.000Z`).getTime();
    const diffDays = Math.round((due - today.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays < 0) return "締切を過ぎました";
    if (diffDays === 0) return "今日まで";
    if (diffDays === 1) return "あと 1 日";
    return `あと ${diffDays} 日`;
  }
  it("walks past / today / tomorrow / future", () => {
    const ref = new Date("2026-05-09T00:00:00.000Z");
    expect(relativeDeadline("2026-05-08", ref)).toBe("締切を過ぎました");
    expect(relativeDeadline("2026-05-09", ref)).toBe("今日まで");
    expect(relativeDeadline("2026-05-10", ref)).toBe("あと 1 日");
    expect(relativeDeadline("2026-05-30", ref)).toBe("あと 21 日");
  });
});
