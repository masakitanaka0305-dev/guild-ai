import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

function collectTsx(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = join(dir, e.name);
      return e.isDirectory() ? collectTsx(full)
        : e.name.endsWith(".tsx") ? [full] : [];
    });
  } catch {
    return [];
  }
}

/** Strip content that is exempt from jargon rules:
 *  - Comments, aria-labels, inline code fences
 *  - TypeScript import statements
 *  - Type annotations and generic parameters (TS code, not UI text)
 *  - String literals that are clearly variable/key definitions
 */
function stripExemptions(content: string): string {
  return content
    .replace(/\/\/[^\n]*/g, "")              // line comments
    .replace(/\/\*[\s\S]*?\*\//g, "")        // block comments
    .replace(/aria-label="[^"]*"/g, "")      // aria-label strings
    .replace(/aria-label=\{`[^`]*`\}/g, "")  // aria-label template literals
    .replace(/`[^\n`]{0,300}`/g, "")         // short inline code fences
    .replace(/^import\b[^\n]*/gm, "")        // import statements
    .replace(/:\s*CCAF\b/g, "")              // TypeScript type annotation
    .replace(/<CCAF[^>]*>/g, "")             // Generic type params
    .replace(/\bCCAF\b(?=\s*[=,;{])/g, "")  // variable names
    .replace(/Record<Currency[^>]*>/g, "")   // Record<Currency,...>
    .replace(/"JPYC"/g, "")                 // "JPYC" string literal in any context
    .replace(/\bJPYC\b(?=\s*:)/g, "")      // JPYC as unquoted object key
    .replace(/\w*CCAF\w*/g, "")             // any identifier containing CCAF
    ;
}

const APP_DIR = join(process.cwd(), "src", "app");
// Exclude API route files — those are machine-facing, jargon is permitted
function isApiRoute(filePath: string): boolean {
  return filePath.includes("/api/");
}

const FORBIDDEN: Array<{ term: string; reason: string }> = [
  { term: "JPYC",           reason: "→ デジタル円 または ¥ に置換" },
  { term: "ステーブルコイン", reason: "→ デジタル円 に置換" },
  { term: "Stablecoin",     reason: "→ デジタル円 に置換" },
  { term: "API Hotbed",     reason: "→ おしごと窓口 に置換（Refinement v2）" },
  { term: "APIエンドポイント", reason: "→ おしごと窓口 に置換（Refinement v2）" },
  { term: "AI連携窓口",      reason: "→ おしごと窓口 に統一（Refinement v2）" },
  { term: "利用窓口（API）", reason: "→ おしごと窓口 に統一（Refinement v2）" },
  { term: "CCAF",           reason: "→ こだわり（実績ログ）に置換" },
  { term: "お仕事",          reason: "→ おしごと（ひらがな）に置換（Final Vision §4）" },
  { term: "取引所",          reason: "→ 保管庫 に置換（Petal Logic §Guardian）" },
  { term: "お財布通帳",      reason: "→ マイ銀行（/guild）または 通帳（セクション名）に統一" },
];

describe("jargon-lint: forbidden terms in app UI pages", () => {
  const files = collectTsx(APP_DIR).filter((f) => !isApiRoute(f));

  it("should find at least 3 app TSX files to lint", () => {
    expect(files.length).toBeGreaterThanOrEqual(3);
  });

  for (const { term, reason } of FORBIDDEN) {
    it(`"${term}" must not appear in user-facing UI (${reason})`, () => {
      const violations: string[] = [];
      for (const file of files) {
        const cleaned = stripExemptions(readFileSync(file, "utf-8"));
        if (cleaned.includes(term)) {
          const relative = file.split("src/app/")[1] ?? file;
          violations.push(relative);
        }
      }
      expect(
        violations,
        `Found "${term}" in: ${violations.join(", ")}`
      ).toHaveLength(0);
    });
  }
});
