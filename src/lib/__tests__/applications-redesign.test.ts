import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Applications redesign + entry from /projects", () => {
  it('/projects renders a 「参加状況を見る →」 link to /applications (Friendly Tone)', () => {
    const src = read("src/app/projects/page.tsx");
    expect(src).toContain("参加状況を見る");
    expect(src).toMatch(/href="\/applications"/);
    // Mercari Lightness (#126): the link picks up the semantic
    // ai-action token instead of the literal cyan-400 utility.
    expect(src).toContain("text-[var(--color-ai-action)]");
    expect(src).toContain("ListChecks");
  });

  it("/applications mobile cards include status chip, MD (font-mono), applied date, timeline, and cancel", () => {
    const src = read("src/app/applications/page.tsx");
    // Status chip with cyan/amber/slate variants
    expect(src).toContain("STATUS_CHIP");
    expect(src).toContain("cyan-400");
    expect(src).toContain("amber-400");
    // MD id rendered with font-mono
    expect(src).toMatch(/font-mono[^"]*">\{row\.mdGuildId\}/);
    // Applied date in slate-400
    expect(src).toMatch(/text-slate-400[^"]*">[\s\S]{0,80}row\.appliedAt/);
    // 3-step timeline component
    expect(src).toContain("STATUS_STEPS");
    expect(src).toMatch(/aria-current=\{active \? "step" : undefined\}/);
    // Cancel button labeled 「取り消す」 with rose styling
    expect(src).toContain("取り消す");
    expect(src).toContain("rose-200");
    expect(src).toContain("rose-900/40");
    expect(src).toContain("rounded-full");
  });

  it("/applications empty-state CTA reads 「お困りごとを探す」 → /projects (Friendly Tone)", () => {
    const src = read("src/app/applications/page.tsx");
    expect(src).toContain("まだ参加していません");
    expect(src).toMatch(/href="\/projects"/);
    expect(src).toContain("お困りごとを探す");
  });

  it("/applications offers sort by 最新順 / ステータス順", () => {
    const src = read("src/app/applications/page.tsx");
    expect(src).toContain("最新順");
    expect(src).toContain("ステータス順");
  });

  it("/applications confirm modal uses role=\"dialog\" + aria-modal", () => {
    const src = read("src/app/applications/page.tsx");
    expect(src).toMatch(/role="dialog"/);
    expect(src).toMatch(/aria-modal="true"/);
  });
});
