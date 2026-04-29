import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "../../..");

describe("AssetSpirit component", () => {
  const src = readFileSync(resolve(root, "src/components/AssetSpirit.tsx"), "utf8");

  it("is a use client component", () => {
    expect(src).toMatch(/^"use client"/);
  });

  it("exports AssetSpirit function", () => {
    expect(src).toContain("export function AssetSpirit");
  });

  it("renders JSX SVG (no dangerouslySetInnerHTML)", () => {
    expect(src).not.toContain("dangerouslySetInnerHTML");
    expect(src).toContain("<svg");
  });

  it("has rank-conditional rendering for all three ranks", () => {
    expect(src).toContain('rank === "S"');
    expect(src).toContain('rank === "A"');
    expect(src).toContain('rank === "B"');
  });

  it("includes blush ellipses for S and A", () => {
    expect(src).toContain("FFB6C1");
  });
});

describe("HumanThumbnail 3-layer system (post-sublimation)", () => {
  const src = readFileSync(resolve(root, "src/components/HumanThumbnail.tsx"), "utf8");

  it("imports BeforeAfterHero as secondary layer", () => {
    expect(src).toContain("BeforeAfterHero");
  });

  it("imports AssetEmblem as fallback layer", () => {
    expect(src).toContain("AssetEmblem");
  });

  it("does NOT import AssetSpirit (sublimated from product cards)", () => {
    expect(src).not.toContain("AssetSpirit");
  });

  it("accepts optional rank prop", () => {
    expect(src).toContain("rank?");
    expect(src).toContain("Rank");
  });

  it("renders AssetEmblem as fallback", () => {
    expect(src).toContain("<AssetEmblem");
  });
});

describe("PassbookTable component", () => {
  const src = readFileSync(resolve(root, "src/components/PassbookTable.tsx"), "utf8");

  it("exports PassbookTable", () => {
    expect(src).toContain("export function PassbookTable");
  });

  it("renders a table element", () => {
    expect(src).toContain("<table");
    expect(src).toContain("<thead");
    expect(src).toContain("<tbody");
  });

  it("has vertical rule border styles", () => {
    expect(src).toContain("borderRight");
  });

  it("shows 年月 and おさいふ通帳 column headers", () => {
    expect(src).toContain("年月");
  });
});

describe("playPassbookChime in sound module", () => {
  const src = readFileSync(resolve(root, "src/lib/sound/index.ts"), "utf8");

  it("exports playPassbookChime", () => {
    expect(src).toContain("export function playPassbookChime");
  });

  it("uses A4 (440Hz) as main tone", () => {
    expect(src).toContain("440");
  });

  it("exports PASSBOOK_CHIME_FREQUENCIES constant", () => {
    expect(src).toContain("PASSBOOK_CHIME_FREQUENCIES");
  });
});

describe("Guardian branding in nav", () => {
  const src = readFileSync(resolve(root, "src/components/SidebarNav.tsx"), "utf8");

  it("nav uses おさいふ for wallet (marketplace removed from nav)", () => {
    expect(src).toContain("おさいふ");
  });

  it("nav uses おさいふ通帳 or 通帳 for wallet", () => {
    expect(src).toMatch(/通帳/);
  });

  it("no longer uses マーケット as standalone label", () => {
    // The word マーケット should not appear as a simple label string
    expect(src).not.toMatch(/"マーケット"/);
  });
});

describe("api/spirit route", () => {
  const src = readFileSync(
    resolve(root, "src/app/api/spirit/[assetId]/route.ts"),
    "utf8"
  );

  it("exports GET handler", () => {
    expect(src).toContain("export function GET");
  });

  it("uses image/svg+xml content type", () => {
    expect(src).toContain("image/svg+xml");
  });

  it("calls renderSpiritSvg", () => {
    expect(src).toContain("renderSpiritSvg");
  });

  it("supports rank query param fallback", () => {
    expect(src).toContain("rank");
    expect(src).toContain("searchParams");
  });
});

describe("jargon-lint guardian terms", () => {
  const src = readFileSync(resolve(root, "src/lib/__tests__/jargon-lint.test.ts"), "utf8");

  it("FORBIDDEN includes 取引所", () => {
    expect(src).toContain("取引所");
  });
});
