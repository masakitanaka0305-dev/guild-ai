import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getOwnedAssets,
  getValueTimeline,
  getTotalValuationJpy,
} from "@/lib/asset-portfolio";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("asset-portfolio: type / rank / status metadata", () => {
  it("every asset carries type, rank, status, valuation and signed delta", () => {
    const assets = getOwnedAssets();
    expect(assets.length).toBeGreaterThan(0);
    for (const a of assets) {
      expect(a.guildId).toMatch(/^GUILD:/);
      expect(["Dev", "Design", "PM", "Cross-functional"]).toContain(a.type);
      expect(["S", "A", "B", "D"]).toContain(a.rank);
      expect(["Private (Vault)", "Encrypted", "Deployed"]).toContain(a.status);
      expect(typeof a.valuationJpy).toBe("number");
      expect(typeof a.monthlyChangePct).toBe("number");
    }
  });

  it("getValueTimeline is deterministic — same seed → same series", () => {
    const a = getValueTimeline(30, "demo-user");
    const b = getValueTimeline(30, "demo-user");
    expect(a.length).toBe(30);
    expect(a).toEqual(b);
  });

  it("getTotalValuationJpy equals the sum of getOwnedAssets().valuationJpy", () => {
    const expected = getOwnedAssets().reduce((s, a) => s + a.valuationJpy, 0);
    expect(getTotalValuationJpy()).toBe(expected);
  });
});

describe("/guild — friendly tone", () => {
  const page = read("src/app/guild/page.tsx");
  const owned = read("src/components/ui/OwnedAssetsSection.tsx");

  it("/guild h1 reads 「あなたの知恵袋銀行」 (Mercari Lightness #126)", () => {
    expect(page).toContain("あなたの知恵袋銀行");
    expect(page).toContain('data-testid="guild-h1"');
  });

  it("/guild mounts <OwnedAssetsSection>", () => {
    expect(page).toContain('import { OwnedAssetsSection } from "@/components/ui/OwnedAssetsSection"');
    expect(page).toMatch(/<OwnedAssetsSection\b/);
  });

  it("OwnedAssetsSection h2 reads 「知恵のカード一覧」 + value line uses 「今のあなたの価値」", () => {
    expect(owned).toContain("知恵のカード一覧");
    expect(owned).toContain("今のあなたの価値：");
  });

  it("Status pills display friendly Japanese (自分だけ / 鍵つき / お仕事中)", () => {
    // Final Polish (#127): Deployed → 「お仕事中」 (more active than 「お貸出し中」).
    expect(owned).toContain('"Private (Vault)": "自分だけ"');
    expect(owned).toContain('"Encrypted":       "鍵つき"');
    expect(owned).toContain('"Deployed":        "お仕事中"');
  });

  it("Type pill labels in role-colors map to the friendly Japanese tags", () => {
    const rc = read("src/lib/role-colors/index.ts");
    expect(rc).toContain('Dev:               "作り方のコツ"');
    expect(rc).toContain('Design:            "見た目の工夫"');
    expect(rc).toContain('PM:                "進め方の相談"');
    expect(rc).toContain('"Cross-functional": "色んな分野"');
  });
});
