import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Friendly Vocab Sweep (#126)", () => {
  it("Intelligence Deck adopts the new step copy (コツ / 鑑定 / 分身AI)", () => {
    const lib = read("src/lib/intelligence-deck/index.ts");
    expect(lib).toContain("あなたのコツ（メモ）を見つける");
    expect(lib).toContain("そのコツの価値を鑑定する");
    expect(lib).toContain("分身AIが企業で働き始める");
  });

  it("Mint completion screen still uses 「太鼓判」 (legacy gold caption)", () => {
    const src = read("src/app/mint/page.tsx");
    // Mercari Lightness keeps the rank-aware caption on the success
    // screen but the surrounding copy stays friendly.
    expect(src).toContain("太鼓判");
    expect(src).toContain("もちものを見る");
  });

  it("Plug-in Apply CTA stays on the friendly 「この知恵を貸す」 verb", () => {
    const src = read("src/components/PlugInApply.tsx");
    expect(src).toContain("この知恵を貸す");
    // Legacy English protocol verbs stay out of the primary aria-label
    expect(src).not.toMatch(/aria-label="Plug My Intelligence/);
  });
});
