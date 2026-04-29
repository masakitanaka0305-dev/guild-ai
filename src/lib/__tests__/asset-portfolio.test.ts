import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = process.cwd();

describe("asset-portfolio: guild page integration", () => {
  const guildSrc     = readFileSync(resolve(root, "src/app/guild/page.tsx"), "utf8");
  const portfolioSrc = readFileSync(resolve(root, "src/components/AssetPortfolio.tsx"), "utf8");

  it("/guild has section heading 運用中の資産：あなたが投稿したMDファイル", () => {
    expect(guildSrc).toContain("運用中の資産：あなたが投稿したMDファイル");
  });

  it("AssetPortfolio renders all 3 status badges (運用中／審査中／停止中)", () => {
    expect(portfolioSrc).toContain("運用中");
    expect(portfolioSrc).toContain("審査中");
    expect(portfolioSrc).toContain("停止中");
  });

  it("AssetPortfolio summary row shows 合計 N 件", () => {
    expect(portfolioSrc).toContain("合計");
    expect(portfolioSrc).toContain("件");
  });

  it("sort dropdown has 4 options (報酬順／コール数順／最終呼び出し順／投稿日順)", () => {
    expect(portfolioSrc).toContain("報酬順");
    expect(portfolioSrc).toContain("コール数順");
    expect(portfolioSrc).toContain("最終呼び出し順");
    expect(portfolioSrc).toContain("投稿日順");
  });

  it("新しく投稿する button links to /sell", () => {
    expect(portfolioSrc).toContain("新しく投稿する");
    expect(portfolioSrc).toContain('href="/sell"');
  });
});
