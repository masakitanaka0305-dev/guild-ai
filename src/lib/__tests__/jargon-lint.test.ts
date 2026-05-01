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
// Explicitly PERMITTED (Intelligence Proof #120): 鑑定中 / Analyzing your Intelligence / Intelligence Balance / 予測印税 / 伝説の知能ギルド / Hall of Fame / 知能の断片 / 真正性証明 / Legend / Expert / Core / Seed / Confidentiality Filter
// Explicitly PERMITTED (Hybrid Plug-in System #121): 知能をプラグイン / 案件に参画 / 接続完了 / Plugged-in / デプロイ済み / エンジニア・エージェント / Connected Intelligence Assets / Agent Active
// Explicitly PERMITTED (Compatibility Report #122): 案件に参画する / 参画済み / この知能で参画します / Intelligence Compatibility Report / Compatibility / 適合率 / 充足要件 / 未充足 / 事前診断 / Pre-Check
// Explicitly PERMITTED (Friendly Tone #123): 知恵を貸す / 知恵のカード / もちもの / お困りごと / ほしい知恵 / カードのジャンル / 作り方のコツ / 見た目の工夫 / 進め方の相談 / 色んな分野 / 自分だけ / 鍵つき / お貸出し中 / 取っておきのメモ / 読みとる / 意味を見つける / 値段をつける / 大切に保管 / お礼 / 参加する / 参加中 / 受付中 / 働いてます / お礼まち / お礼受領 / マッチ度 / AIの参考書 / 時価のうごき / 太鼓判 / 金の太鼓判 / 銀の太鼓判 / 銅の太鼓判 / みならい / 知恵を出品する / Hashed on Chain / Scan / Identify Context / Appraise Value
// Explicitly PERMITTED (Mercari Lightness #126): 知恵袋銀行 / 知恵袋の中身 / 今、働いています / 困りごとを助ける / この困りごとを助ける / 似た知恵を出品してみよう / 金の太鼓判カードにする / 銀の太鼓判カードにする / 銅の太鼓判カードにする / みならいカードにする / あなたのコツ（メモ）を見つける / そのコツの価値を鑑定する / 分身AIが企業で働き始める / あなたの分身（AI） / プロの技術が詰まっています / 安定して動き続けています / 実装の意図が明確です / 実際に動くコードが入っています / テストや検証の跡が残っています
// Explicitly PERMITTED (Final Polish #127): あなたの知恵の価値 / お仕事中 / 想定お礼
// FORBIDDEN as UI tokens (Final Polish #127): "Mercari Purple" / "メルカリ・パープル" / "お礼のゴールド" / "Cyan Helper" / "Brand Palette" — these are internal names only.
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
  // ─── Brand (#123) — Rezon は不採用、ギルドAI を維持 ─────────────
  { term: "Rezon",                   reason: "→ ギルドAI に統一（仮称 Rezon は不採用）" },
  { term: "レゾン",                  reason: "→ ギルドAI に統一（仮称 Rezon は不採用）" },
  // ─── Final Polish (#127) — internal palette names must not surface in UI
  { term: "Mercari Purple",          reason: "→ 内部呼称のみ。UI には Mercari Purple と書かない（Brand Palette #127）" },
  { term: "メルカリ・パープル",       reason: "→ 内部呼称のみ。UI 非表示（Brand Palette #127）" },
  { term: "お礼のゴールド",            reason: "→ 内部呼称のみ。UI 非表示（Brand Palette #127）" },
  { term: "Cyan Helper",             reason: "→ 内部呼称のみ。UI 非表示（Brand Palette #127）" },
  { term: "メルカリStyle",            reason: "→ 内部呼称のみ。UI 非表示（Brand Palette #127）" },
  // Final Polish (#127): 旧表記の撤廃
  { term: "お貸出し中",               reason: "→ 「お仕事中」 に置換（Final Polish #127）" },
  { term: "もちもの時価のうごき",      reason: "→ 「あなたの知恵の価値」 に置換（Final Polish #127）" },
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

// ─── Hybrid Plug-in System (#121): "エージェントをデプロイ" CTA ban ──────────
//
// The phrase is allowed in body / docs / explanations, but it must not
// appear as a primary CTA. We detect that by looking for it inside any
// aria-label="..." attribute (CTAs always carry an aria-label).
describe("jargon-lint: deploy-cta cannot be the aria-label of a primary button", () => {
  const PRIMARY_FILES = [
    ...collectTsx(join(process.cwd(), "src", "app")),
    ...collectTsx(join(process.cwd(), "src", "components")),
  ].filter((f) => !isApiRoute(f));

  it('"エージェントをデプロイ" must not surface as an aria-label CTA', () => {
    const violations: string[] = [];
    for (const file of PRIMARY_FILES) {
      const content = readFileSync(file, "utf-8");
      // Skip jargon-lint allow-list comments inside the lint test itself.
      if (content.includes('aria-label="エージェントをデプロイ"')) {
        violations.push(file.split("src/")[1] ?? file);
      }
    }
    expect(
      violations,
      `Primary CTA aria-label still uses エージェントをデプロイ in: ${violations.join(", ")}`,
    ).toHaveLength(0);
  });

  // Friendly Tone (#123) — primary CTA settles on 「この知恵を貸す（参加する）」.
  // "応募する" / "この案件に応募する" remain banned as CTAs, and prior
  // English/protocol labels also can't surface as the primary aria-label.
  it('"応募する" / "この案件に応募する" must not surface as an aria-label CTA', () => {
    const violations: string[] = [];
    for (const file of PRIMARY_FILES) {
      const content = readFileSync(file, "utf-8");
      if (
        content.includes('aria-label="応募する"') ||
        content.includes('aria-label="この案件に応募する"')
      ) {
        violations.push(file.split("src/")[1] ?? file);
      }
    }
    expect(
      violations,
      `Primary CTA aria-label still uses 応募する in: ${violations.join(", ")}`,
    ).toHaveLength(0);
  });

  // Friendly Tone (#123) — English protocol labels banned in primary UI
  // chrome (page <h1>). They may still appear in code comments, internal
  // identifiers, and documentation. We detect by scanning the literal
  // <h1> contents for the banned tokens.
  const ENGLISH_UI_BANS = [
    "Owned Assets",
    "Plugin My Intelligence",
    "Intelligence Minting",
    "Project Goals",
    "Required Intelligence",
  ];
  for (const term of ENGLISH_UI_BANS) {
    it(`"${term}" must not surface inside an <h1>...</h1>`, () => {
      const violations: string[] = [];
      for (const file of PRIMARY_FILES) {
        const content = readFileSync(file, "utf-8");
        // crude: collect every <h1>...</h1> body and check for the term
        const matches = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/g) ?? [];
        for (const m of matches) {
          if (m.includes(term)) {
            violations.push(file.split("src/")[1] ?? file);
            break;
          }
        }
      }
      expect(
        violations,
        `<h1> still contains "${term}" in: ${violations.join(", ")}`,
      ).toHaveLength(0);
    });
  }
});
