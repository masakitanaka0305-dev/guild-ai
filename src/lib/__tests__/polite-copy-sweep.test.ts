import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Polite copy (#125) — primary actions use 丁寧語", () => {
  it("/admin/model-settings primary CTA reads 「設定を保存して評価へ進みます」", () => {
    const src = read("src/app/admin/model-settings/page.tsx");
    expect(src).toContain("設定を保存して評価へ進みます");
    expect(src).not.toMatch(/>保存<|>次へ</);
  });

  it("/admin/ops primary CTA reads 「対応します」 (verb form)", () => {
    const src = read("src/app/admin/ops/page.tsx");
    expect(src).toContain('aria-label="アラートに対応します"');
    expect(src).toContain("対応します");
  });

  it("/applications cancel modal swaps 「やめる」 for 「いいえ、戻ります」", () => {
    const src = read("src/app/applications/page.tsx");
    expect(src).toContain("いいえ、戻ります");
    expect(src).not.toContain(">やめる<");
  });

  it("ThemeSwitch aria-label uses polite Japanese (...に切り替えます)", () => {
    const src = read("src/components/ui/ThemeSwitch.tsx");
    expect(src).toContain("Logic White に切り替えます");
    expect(src).toContain("Midnight に切り替えます");
  });
});
