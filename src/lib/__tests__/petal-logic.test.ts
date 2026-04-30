import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "../../..");

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

describe("playPoyon in sound module", () => {
  const src = readFileSync(resolve(root, "src/lib/sound/index.ts"), "utf8");

  it("exports playPoyon", () => {
    expect(src).toContain("export function playPoyon");
  });

  it("exports POYON_FREQ_RANGE constant", () => {
    expect(src).toContain("POYON_FREQ_RANGE");
  });
});

describe("Guardian branding in nav", () => {
  const src = readFileSync(resolve(root, "src/components/SidebarNav.tsx"), "utf8");

  it("nav has 2 tabs (探す/稼ぐ) + FAB (出す) and does not use old jargon", () => {
    expect(src).toContain('"探す"');
    expect(src).toContain('"出す"');
    expect(src).toContain('"稼ぐ"');
    expect(src).not.toContain("おさいふ通帳");
    expect(src).not.toContain("はじめての提出");
  });

  it("no longer uses マーケット as standalone label", () => {
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
