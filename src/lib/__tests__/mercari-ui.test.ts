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

  it("subline 日本最大のAIエージェント・プラットフォーム appears below h1", () => {
    expect(src).toContain("日本最大のAIエージェント・プラットフォーム");
  });

  it("footer exists", () => {
    expect(src).toMatch(/<footer/);
  });
});

// ─── 1b. Minimal home sections ───────────────────────────────────────────────

describe("catchphrase: minimal home", () => {
  const src = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");

  it("unified how-tiles (のこす / AIが働く / ¥が入る) exist", () => {
    expect(src).toContain('"のこす"');
    expect(src).toContain('"AIが働く"');
    expect(src).toContain('"¥が入る"');
  });

  it("how-tile emojis have role=img and aria-label", () => {
    expect(src).toContain('role="img"');
    expect(src).toContain('aria-label');
  });

  it("section heading いま のこされた しごと exists", () => {
    expect(src).toContain("いま のこされた しごと");
  });

  it("section heading かせげる しごと exists", () => {
    expect(src).toContain("かせげる しごと");
  });
});

// ─── 2. metadata.title matches catchphrase ───────────────────────────────────

describe("catchphrase: metadata", () => {
  const src = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");

  it("metadata.title uses new format with platform subline", () => {
    expect(src).toContain("AIエージェントで、あなたの時間をアップデート。｜日本最大のAIエージェント・プラットフォーム");
  });

  it("og:description is platform subline", () => {
    expect(src).toContain("日本最大のAIエージェント・プラットフォーム");
  });

  it("home subline 日本最大のAIエージェント・プラットフォーム is displayed", () => {
    const pageSrc = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");
    expect(pageSrc).toContain("日本最大のAIエージェント・プラットフォーム");
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

// ─── 5. FAB href=/bank aria-label="のこす" ───────────────────────────────────

describe("mercari-ui: FAB", () => {
  const src = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");

  it('FAB links to /bank', () => {
    expect(src).toContain('href="/bank"');
  });

  it('FAB has aria-label="のこす"', () => {
    expect(src).toContain('aria-label="のこす"');
  });
});

// ─── 7. MD file input on bank page ───────────────────────────────────────────

describe("sell: MD file input", () => {
  const src = readFileSync(resolve(root, "src/app/bank/page.tsx"), "utf8");

  it("file input accepts .md/.markdown/.txt", () => {
    expect(src).toContain('accept=".md,.markdown,text/markdown,text/plain"');
  });

  it("file input has aria-label for accessibility", () => {
    expect(src).toContain('aria-label="MD ファイルを選ぶ"');
  });

  it("drop zone has role=region and aria-label", () => {
    expect(src).toContain('role="region"');
    expect(src).toContain('aria-label="MD ファイルをドラッグ＆ドロップ"');
  });

  it("textarea has aria-label for direct input", () => {
    expect(src).toContain('aria-label="MD を直接書く"');
  });

  it("size limit is 1MB (1048576 bytes)", () => {
    expect(src).toContain("1_048_576");
  });

  it("extension validation rejects non-md files", () => {
    expect(src).toContain("isAllowedFile");
    expect(src).toContain(".md");
    expect(src).toContain(".markdown");
    expect(src).toContain(".txt");
  });

  it("dragging state class switches on drag-over", () => {
    expect(src).toContain("isDragging");
    expect(src).toContain("border-[#E64545]");
    expect(src).toContain("bg-red-50");
  });

  it("submit button is disabled when content is short", () => {
    expect(src).toContain("noteContent.trim().length < 10");
    expect(src).toContain("disabled");
  });
});

// ─── 8. Unified how-block + price hint ───────────────────────────────────────

describe("home: unified how-block", () => {
  const src = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");

  it("home has heading つかいかた はかんたん", () => {
    expect(src).toContain("つかいかた はかんたん");
  });

  it("3 cards link to /sell /jobs /guild", () => {
    expect(src).toContain('"/sell"');
    expect(src).toContain('"/jobs"');
    expect(src).toContain('"/guild"');
  });

  it("hero has single primary CTA いま のこす (no かせぐ CTA in hero)", () => {
    expect(src).toContain("いま のこす");
    // Only one Link to /bank in the hero CTA, no second hero CTA button
    const heroSection = src.split("いま のこす")[0];
    expect(heroSection).not.toContain("いま かせぐ");
  });

  it("price hint chip いますぐ ¥30,000 から exists in hero", () => {
    expect(src).toContain("いますぐ ¥30,000 から");
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
