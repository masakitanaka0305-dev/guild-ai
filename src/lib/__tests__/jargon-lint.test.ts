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

// Explicitly PERMITTED (Grand Launch v1): 永続化 / インデックス基金 / 連鎖配当 / グローバル着金 / 知能指数 / 累積配当
// Explicitly PERMITTED (C2C Exchange v1): Hobby / Pro Indie / Enterprise / パイプライン / 引用ネットワーク / 師匠 / 弟子 / 集合知
// Explicitly PERMITTED (Productization v1): JSON Schema / OpenAPI / 精度 / 平均レイテンシ / p95 / エラー率 / SLA / 法人検索
// Explicitly PERMITTED (Competitive Moat v1): 実行エビデンス / プロの工夫 / 価値のデルタ / ゼロデイ / 未学習 / 対応MD / 募集中
// Explicitly PERMITTED (Intelligence Ledger + Export Hub #90/#94): 権利の系譜 / 自動分配履歴 / 為替対応 / AI向け翻訳 / Blackbox / 実行専用 / ドル建て / ダイナミック・プライシング
// Explicitly PERMITTED (Strategic Moat #95): Encapsulated Intelligence / クローラー検知 / rate limit / オリジン署名 / オリジン認証 / JP発祥 / Global Scout
// Explicitly PERMITTED (Intelligence Marketplace #105): Validation Score / Matching Score / Asset Ledger / Escrow Reserve / Ownership Attestation / Terms of Service / Liability Shift
// Explicitly PERMITTED (Water Guild — Hexagonal Robustness #115): 登記（Sync） / 精製（Mint） / 確認して進む / Water Guild / Hexagon / Wave / 資産台帳 / コードベース
// Explicitly PERMITTED (Water Guild v2 — UX/UI refinements #116): 資産運用者 / 自動でおすすめを選択 / もっと見る / AI Pre-select / 1-Tap Mint / Sticky Action / ClampDescription
// Explicitly PERMITTED (Water Guild v3 — direct CTA copy #117): この知能で応募 / 知能資産 / あなたのスキル証明 / GitHub から始める / まだ知能を登記していません / あなたの知能を資産化する場所
// Explicitly PERMITTED (UX pass 2 — agent-deploy CTA #118): エージェントをデプロイ / 知能をプラグイン / エージェント派遣中 / 思考をコピー / 後で設定 / Coming Soon / タブ切替 / 応募状況を見る / 取り消す / 別の知能を選びましょう / 編集する
// Explicitly PERMITTED (Intelligence Deck #119): 自分の知能を登記する / 知能の資産化を開始する / 登記済みエージェント数 / 登記 (Sync) / 鑑定 (Grade) / 派遣 (Deploy) / STEP 1 / STEP 2 / STEP 3
const FORBIDDEN: Array<{ term: string; reason: string }> = [
  // Auth UI terms were forbidden when auth was postponed to v2.
  // Re-introduced (2026-04-30): GUILD AI Engineer Onboarding spec brings back /login + /welcome
  // with NextAuth (GitHub/Google) + DEV bypass button. Terms below are now permitted.
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
  { term: "おだちん",        reason: "→ 報酬 に置換（18y/o tone v2）" },
  { term: "おたから",        reason: "→ 資産 に置換（18y/o tone v2）" },
  { term: "ぶき",            reason: "→ スキル / ノート に置換（18y/o tone v2）" },
  { term: "シマエナガ通帳",   reason: "→ UI 上は「端数残高」に置換（内部モジュール名は shima-ledger で維持）" },
  { term: "シマエナガ",             reason: "→ マスコット削除（Asset Ledger brand v1）。docs/Asset-Ledger-Brand設計.md 参照" },
  { term: "かわいい",               reason: "→ プロ向けトーンに統一（Asset Ledger brand v1）" },
  { term: "shadow-for-employer",    reason: "→ 反検知機能は非実装方針。ToS で個人責任明確化に留める" },
  { term: "stealth-employer",       reason: "→ 反検知機能は非実装方針" },
  { term: "企業隠蔽",               reason: "→ 反検知機能は非実装方針" },
  { term: "会社にバレない",          reason: "→ 反検知機能は非実装方針" },
  // ─── Water Guild — Hexagonal Robustness (#115) ───────────────────
  { term: "リポジトリ",              reason: "→ コードベース に置換（Water Guild v1）" },
  { term: "エンドポイント",          reason: "→ おしごと窓口 に置換（Water Guild v1 / Endpoint UI 表記禁止）" },
  { term: "squirtle",               reason: "→ 特定キャラ画像/名は禁止（Water Guild は幾何学のみ）" },
  { term: "shimaenaga",             reason: "→ マスコット禁止（Water Guild は幾何学のみ）" },
  { term: "kawaii",                 reason: "→ プロ向けトーンに統一（Water Guild v1）" },
  // ─── Water Guild v3 — direct CTA copy (#117) ─────────────────────
  { term: "資産で応募する",          reason: "→ 「エージェントをデプロイ」 に置換（UX pass 2 #118）" },
  { term: "プラグイン応募",          reason: "→ 「知能をプラグイン」 に置換（Water Guild v3）" },
  // ─── UX pass 2 — agent-deploy CTA (#118) ─────────────────────────
  { term: "この案件に応募する",      reason: "→ 「エージェントをデプロイ」 に置換（UX pass 2 — \"応募\" は人間トーン、エージェント派遣に統一）" },
  // ─── Intelligence Deck (#119) — signup-style language is banned ──
  { term: "Signup",                  reason: "→ 「自分の知能を登記する」 に置換（Intelligence Deck — \"登録\"系は不使用）" },
  { term: "Sign up",                 reason: "→ 「自分の知能を登記する」 に置換（Intelligence Deck — \"登録\"系は不使用）" },
  { term: "サインアップ",            reason: "→ 「自分の知能を登記する」 に置換（Intelligence Deck — \"登録\"系は不使用）" },
  { term: "会員登録",                reason: "→ 「知能の資産化を開始する」 に置換（Intelligence Deck — \"登録\"系は不使用）" },
  { term: "無料登録",                reason: "→ 「知能の資産化を開始する」 に置換（Intelligence Deck — \"登録\"系は不使用）" },
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
