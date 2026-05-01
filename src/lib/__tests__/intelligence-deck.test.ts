import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Intelligence Deck — three-step onboarding home", () => {
  it("DECK_STEPS contains 登記 (Sync) → 鑑定 (Grade) → 派遣 (Deploy) in order", () => {
    const src = read("src/lib/intelligence-deck/index.ts");
    expect(src).toContain('title: "登記 (Sync)"');
    expect(src).toContain('title: "鑑定 (Grade)"');
    expect(src).toContain('title: "派遣 (Deploy)"');
    // Subtitles match the spec verbatim
    expect(src).toContain("GitHub 連携であなたの思考を抽出");
    expect(src).toContain("AI があなたの専門知能を資産として評価");
    expect(src).toContain("あなたの代わりに働く AI エージェントを企業へ");
  });

  it("getRegisteredAgents returns the deterministic guild count 1284", async () => {
    const mod = await import("@/lib/intelligence-deck");
    expect(mod.getRegisteredAgents()).toBe(1284);
    expect(mod.formatAgentCount(1284)).toBe("1,284");
  });

  it("DeckHome renders all 3 STEP cards via <ol> in order", () => {
    const src = read("src/components/intelligence-deck/DeckHome.tsx");
    expect(src).toContain('<ol');
    expect(src).toMatch(/aria-label="知能を資産化する 3 ステップ"/);
    expect(src).toMatch(/DECK_STEPS\.map/);
    const card = read("src/components/intelligence-deck/StepCard.tsx");
    expect(card).toContain("STEP {step}");
    expect(card).toMatch(/data-testid=\{`deck-step-\$\{step\}`\}/);
    expect(card).toContain("<li");
  });

  it("HeroButton text is 「自分の知能を登記する」, links to /onboarding/repos, with aria-label and cyan glow", () => {
    const src = read("src/components/intelligence-deck/HeroButton.tsx");
    expect(src).toContain("自分の知能を登記する");
    expect(src).toMatch(/href="\/onboarding\/repos"/);
    expect(src).toContain('aria-label="自分の知能を登記する"');
    // Cyan-400 fill + static glow shadow + rounded-full
    expect(src).toContain("bg-cyan-400");
    expect(src).toContain("text-[#0B1121]");
    expect(src).toContain("rounded-full");
    expect(src).toMatch(/shadow-\[0_0_0_2px_rgba\(34,211,238,0\.5\),0_0_28px_rgba\(34,211,238,0\.35\)\]/);
  });

  it("DeckHome surfaces 「登記済みエージェント数：1,284 体」 in the top-right", () => {
    const src = read("src/components/intelligence-deck/DeckHome.tsx");
    expect(src).toContain("登記済みエージェント数：");
    expect(src).toContain("data-testid=\"deck-registered-count\"");
    expect(src).toContain("text-cyan-400/80");
    expect(src).toContain("font-mono");
  });

  it("/intelligence-deck route mounts DeckHome", () => {
    const src = read("src/app/intelligence-deck/page.tsx");
    expect(src).toContain("DeckHome");
  });

  it("/onboarding gates anonymous visitors to DeckHome", () => {
    const src = read("src/app/onboarding/page.tsx");
    expect(src).toContain('useAuthState');
    expect(src).toContain("DeckHome");
    expect(src).toMatch(/auth\.status === "anonymous"/);
  });
});

// ─── jargon: signup-style language must not surface in UI ─────────────────────

describe("jargon: signup-style copy is banned from UI surfaces", () => {
  function collectTsx(dir: string): string[] {
    try {
      return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const full = join(dir, e.name);
        return e.isDirectory() ? collectTsx(full)
          : e.name.endsWith(".tsx") ? [full] : [];
      });
    } catch { return []; }
  }
  // Skip API route + comments. Comments are stripped before matching.
  function strip(content: string): string {
    return content
      .replace(/\/\/[^\n]*/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/aria-label="[^"]*"/g, "");
  }
  const SIGNUP_BAN = ["Signup", "Sign up", "サインアップ", "会員登録", "無料登録"];
  const files = [
    ...collectTsx(join(ROOT, "src/app")),
    ...collectTsx(join(ROOT, "src/components")),
  ].filter((f) => !f.includes("/api/"));

  it("ships at least one Intelligence Deck file in the scan list", () => {
    expect(files.some((f) => f.includes("intelligence-deck"))).toBe(true);
  });

  for (const term of SIGNUP_BAN) {
    it(`"${term}" must not appear in any UI tsx`, () => {
      const violations: string[] = [];
      for (const file of files) {
        if (strip(read(file.split(`${ROOT}/`)[1])).includes(term)) {
          violations.push(file.split("src/")[1] ?? file);
        }
      }
      expect(violations, `"${term}" found in: ${violations.join(", ")}`).toHaveLength(0);
    });
  }

  it('Intelligence Deck files must use 登記, never 登録', () => {
    const deckFiles = files.filter((f) => f.includes("intelligence-deck"));
    expect(deckFiles.length).toBeGreaterThanOrEqual(2);
    for (const f of deckFiles) {
      const content = strip(read(f.split(`${ROOT}/`)[1]));
      expect(content, `登録 found in ${f}`).not.toContain("登録");
    }
  });
});
