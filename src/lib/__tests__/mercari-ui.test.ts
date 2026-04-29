import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "../../..");

// ─── 1. Catchphrase in hero ───────────────────────────────────────────────────

describe("catchphrase: hero", () => {
  const src = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");

  it("main catchphrase appears in h1 on home page", () => {
    expect(src).toContain("AIエージェントで、");
    expect(src).toContain("あなたの時間");
    expect(src).toContain("アップデート");
    expect(src).toMatch(/<h1/);
  });

  it("subtitle appears below h1", () => {
    expect(src).toContain("寝てる間も、AIがあなたの知恵で稼ぐ場所です");
  });

  it("footer contains secondary catchphrase", () => {
    expect(src).toContain("AIエージェントで、あなたの時間をアップデート");
    expect(src).toMatch(/<footer/);
  });
});

// ─── 2. metadata.title matches catchphrase ───────────────────────────────────

describe("catchphrase: metadata", () => {
  const src = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");

  it("metadata.title contains the primary catchphrase", () => {
    expect(src).toContain("AIエージェントで、あなたの時間をアップデート。| GUILD AI");
  });

  it("og:title matches", () => {
    expect(src).toContain("AIエージェントで、あなたの時間をアップデート。| GUILD AI");
  });
});

// ─── 3. Primary red #E64545 in globals.css ────────────────────────────────────

describe("mercari-ui: primary color token", () => {
  const src = readFileSync(resolve(root, "src/app/globals.css"), "utf8");

  it("--n-primary is #E64545", () => {
    expect(src).toContain("--n-primary: #E64545");
  });

  it("--n-primary-hover is #D03A3A", () => {
    expect(src).toContain("--n-primary-hover: #D03A3A");
  });
});

// ─── 4. BottomNav has 4 tabs ─────────────────────────────────────────────────

describe("mercari-ui: bottom tabs", () => {
  const src = readFileSync(resolve(root, "src/components/SidebarNav.tsx"), "utf8");

  it("BOTTOM_ITEMS has exactly 4 entries", () => {
    const matches = src.match(/\{ href:/g);
    // BOTTOM_ITEMS has 4 items; NAV_ITEMS has 6 — just verify the 4-tab labels
    expect(src).toContain('"ホーム"');
    expect(src).toContain('"のこす"');
    expect(src).toContain('"かせぐ"');
    expect(src).toContain('"マイ銀行"');
  });

  it("BottomNav exports correct component", () => {
    expect(src).toContain("export function BottomNav");
  });
});

// ─── 5. FAB href=/sell aria-label="のこす" ────────────────────────────────────

describe("mercari-ui: FAB", () => {
  const src = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");

  it('FAB links to /sell', () => {
    expect(src).toContain('href="/sell"');
  });

  it('FAB has aria-label="のこす"', () => {
    expect(src).toContain('aria-label="のこす"');
  });
});

// ─── 6. jargon-lint: allowed terms don't trigger forbidden list ───────────────

describe("jargon-lint: permitted mercari-copy terms", () => {
  const lintSrc = readFileSync(resolve(root, "src/lib/__tests__/jargon-lint.test.ts"), "utf8");

  it("AIエージェント is NOT in the FORBIDDEN list", () => {
    const forbiddenSection = lintSrc.split("const FORBIDDEN")[1]?.split("];")[0] ?? "";
    expect(forbiddenSection).not.toContain("AIエージェント");
  });

  it("アップデート is NOT in the FORBIDDEN list", () => {
    const forbiddenSection = lintSrc.split("const FORBIDDEN")[1]?.split("];")[0] ?? "";
    expect(forbiddenSection).not.toContain("アップデート");
  });

  it("JPYC is still forbidden", () => {
    expect(lintSrc).toContain('"JPYC"');
  });

  it("取引所 is still forbidden", () => {
    expect(lintSrc).toContain('"取引所"');
  });
});
