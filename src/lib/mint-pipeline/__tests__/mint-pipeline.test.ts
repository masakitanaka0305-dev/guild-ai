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

  it("completion screen mounts <CinematicMint> with rank + valuation (#131)", () => {
    expect(page).toContain('data-testid="mint-complete"');
    // The legacy congratulatory block was replaced with the four-phase
    // cinematic reveal so users actually see the rank-aware演出.
    expect(page).toContain('import { CinematicMint }');
    expect(page).toMatch(/<CinematicMint\s+rank=\{rank\}\s+valuationJpy=\{valuationJpy\}/);
    // Reset CTA stays so users can run another Mint without a reload.
    expect(page).toContain("もう一枚 出品する");
  });

  it("cinematic reveal is the default; ?real=1 opts back into the importer flow (#132)", () => {
    // #132 — cinematic reveal renders by default. The legacy importer
    // + 4-step pipeline now requires `?real=1` to opt in.
    expect(page).toContain("useSearchParams");
    expect(page).toMatch(/params\?\.get\("rank"\)/);
    expect(page).toMatch(/params\?\.get\("real"\)\s*===\s*"1"/);
    // `?demo=1` is still honoured for compatibility.
    expect(page).toMatch(/params\?\.get\("demo"\)\s*===\s*"1"/);
    // Default-on logic: cinematic is on unless `real` is set (and even
    // `?real=1&demo=1` keeps the cinematic).
    expect(page).toMatch(/cinematicDefault\s*=\s*!realParam \|\| demoParam/);
    // Initial useState seeds both `imported` and `done` to true so the
    // SSR/client hydration lands on the reveal — no extra clicks.
    expect(page).toMatch(/useState\(cinematicDefault\)/);
    expect(page).toContain("RANK_VALUATIONS");
    expect(page).toMatch(/DEFAULT_RANK:\s*Rank\s*=\s*"A"/);
  });
});
