import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(join(ROOT, "src/app/profile/page.tsx"), "utf-8");

describe("/profile — Phase H layout", () => {
  it("rank badge sits at the top of the header at size 80 with the sub-label caption", () => {
    expect(src).toMatch(/<HexRankBadge[^>]*size=\{80\}[^>]*showSubLabel/);
    // Header carries the cyan shell-gray rail
    expect(src).toMatch(/data-testid="profile-header"[\s\S]{0,400}border-l-cyan-400/);
  });

  it("登記済み MD タブ が「知能の断片」カードを表示する（shell-gray + cyan border）", () => {
    expect(src).toContain("知能の断片");
    expect(src).toContain('data-testid="knowledge-fragments"');
    expect(src).toContain('data-testid="knowledge-fragment-card"');
    // Each card uses bg-[#162035] + border-l-cyan-400/30
    expect(src).toMatch(/data-testid="knowledge-fragment-card"[\s\S]{0,400}bg-\[#162035\]/);
    expect(src).toMatch(/data-testid="knowledge-fragment-card"[\s\S]{0,400}border-l-cyan-400\/30/);
  });
});
