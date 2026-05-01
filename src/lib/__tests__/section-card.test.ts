import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("SectionCard — unified card wrapper for /projects/[id]", () => {
  const card = read("src/components/ui/SectionCard.tsx");

  it("ships the unified visual contract (rounded-2xl, cyan rail, slate surface)", () => {
    expect(card).toContain("rounded-2xl border border-white/10 bg-[#162035]");
    expect(card).toContain("p-5 sm:p-6");
    expect(card).toContain("mb-4");
    expect(card).toContain("border-l-4 border-cyan-400 pl-3");
    expect(card).toContain("text-white font-semibold text-base sm:text-lg");
  });

  it("/projects/[id] wraps all 5 sections with SectionCard", () => {
    const src = read("src/app/projects/[id]/page.tsx");
    expect(src).toContain('import { SectionCard } from "@/components/ui/SectionCard"');
    // Friendly Tone (#123): なぜマッチしているか → ほしい知恵（必要なカード）
    const sections = ["技術スタック", "ほしい知恵（必要なカード）", "現場課題", "Net Payout", "Competition"];
    for (const heading of sections) {
      const re = new RegExp(`<SectionCard[^>]*title="${heading}"`);
      expect(src, `SectionCard for "${heading}"`).toMatch(re);
    }
    // Old `section-card` div wrappers for those sections are gone (the
    // matching-score sidebar still uses the legacy class — that's fine).
    expect(src).not.toContain('mb-3">技術スタック</p>');
    expect(src).not.toContain('mb-3">\n              なぜマッチしているか');
  });

  it("/projects/[id] uses lucide Check (cyan-400) and AlertCircle (amber-300) for matched/missing", () => {
    const src = read("src/app/projects/[id]/page.tsx");
    expect(src).toMatch(/<Check[\s\S]*?stroke-cyan-400/);
    expect(src).toMatch(/<AlertCircle[\s\S]*?stroke-amber-300/);
  });
});
