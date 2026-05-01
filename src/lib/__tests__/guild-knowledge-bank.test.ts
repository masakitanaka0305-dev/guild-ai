import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Mercari Lightness (#126) — /guild 知恵袋銀行 + CoinCounter", () => {
  const guild = read("src/app/guild/page.tsx");

  it("/guild h1 reads 「あなたの知恵袋銀行」", () => {
    expect(guild).toContain('data-testid="guild-h1"');
    expect(guild).toContain("あなたの知恵袋銀行");
    expect(guild).not.toContain("マイページ — もちもの");
  });

  it("/guild mounts <CoinCounter> with the live earnings as initial value", () => {
    expect(guild).toContain('import { CoinCounter }');
    expect(guild).toMatch(/<CoinCounter\s+initialJpy=\{earnings\.jpy\}/);
    expect(guild).toContain("知恵袋の中身");
  });

  it("each weapon card shows the 「今、働いています」 working pulse", () => {
    expect(guild).toContain('data-testid="weapon-working-now"');
    expect(guild).toContain("今、働いています");
    expect(guild).toMatch(/animate-pulse motion-reduce:animate-none/);
  });

  it("CoinCounter renders +¥X delta with aria-live and motion-safe fade", () => {
    const cc = read("src/components/ui/CoinCounter.tsx");
    expect(cc).toContain('data-testid="coin-counter"');
    expect(cc).toContain('data-testid="coin-counter-delta"');
    expect(cc).toContain('aria-live="polite"');
    expect(cc).toContain("motion-safe:animate-fade-in");
  });

  it("RankBadge sublabel uses 「金/銀/銅 の太鼓判」 (Mercari Lightness medals)", () => {
    const badge = read("src/components/RankBadge.tsx");
    expect(badge).toContain("RANK_COLOR_TOKEN");
    expect(badge).toContain("{tier}の太鼓判");
    expect(badge).not.toContain("お墨付き");
    expect(badge).not.toContain("高評価");
  });
});
