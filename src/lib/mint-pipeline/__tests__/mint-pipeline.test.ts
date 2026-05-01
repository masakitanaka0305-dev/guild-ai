import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MINT_STEPS, MINT_IMPORTS } from "@/lib/mint-pipeline";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("mint-pipeline — 4 friendly steps", () => {
  it("ships the four steps in spec order with the friendly Japanese labels", () => {
    expect(MINT_STEPS.map((s) => s.id)).toEqual([
      "scan",
      "identify-context",
      "appraise-value",
      "hashed-on-chain",
    ]);
    expect(MINT_STEPS[0].label).toBe("読みとる");
    expect(MINT_STEPS[1].label).toBe("意味を見つける");
    expect(MINT_STEPS[2].label).toBe("値段をつける");
    expect(MINT_STEPS[3].label).toBe("大切に保管");
  });

  it("retains the english subtitle (Scan / Identify Context / ...) as the parens annotation", () => {
    expect(MINT_STEPS[0].subtitle).toBe("Scan");
    expect(MINT_STEPS[3].subtitle).toBe("Hashed on Chain");
  });

  it("import-source list covers MD upload / GitHub / Slack", () => {
    const ids = MINT_IMPORTS.map((i) => i.id);
    expect(ids).toContain("md-upload");
    expect(ids).toContain("github");
    expect(ids).toContain("slack");
  });
});

describe("/mint — copy assertions", () => {
  const page = read("src/app/mint/page.tsx");

  it("page heading reads 「取っておきのメモを教えてください」", () => {
    expect(page).toContain("取っておきのメモを教えてください");
    expect(page).toContain("世界の AI に貸し出される");
    expect(page).toContain("知恵のカード");
  });

  it("completion screen carries the 太鼓判レベル congratulatory copy", () => {
    expect(page).toContain('data-testid="mint-complete"');
    expect(page).toContain("おめでとうございます！");
    expect(page).toContain("仕事の場面");
    // Note: split across spans for the gold tint, but the user-facing
    // sentence reads "...金 の太鼓判レベルの知恵ですね！".
    expect(page).toContain("太鼓判レベルの知恵");
    expect(page).toContain("金</span> の太鼓判");
  });

  it("ShieldedBadge mounts on the completion screen", () => {
    expect(page).toContain('import { ShieldedBadge } from "@/components/ui/ShieldedBadge"');
    expect(page).toMatch(/<ShieldedBadge\b/);
    const badge = read("src/components/ui/ShieldedBadge.tsx");
    expect(badge).toContain("大手 AI のクローラから守られています");
  });

  it("CrystalSvg shows on the completion screen with role=img + aria-label", () => {
    expect(page).toMatch(/<CrystalSvg\b/);
    const crystal = read("src/components/ui/CrystalSvg.tsx");
    expect(crystal).toMatch(/role="img"/);
    expect(crystal).toContain('aria-label="プロジェクト・クリスタル"');
  });
});
