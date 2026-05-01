# Intelligence Compatibility Report

> 「適合率」を見せるのは、AI に任せるためではなく、人間が参画する前にミスマッチを減らすため。

このドキュメントは Compatibility Report Update（#122）の設計仕様。
新規ライブラリ `@/lib/compatibility-report` ／ `<CompatibilityReportSection>`
／ `/projects/[id]` のセクション順序、CTA 簡素化（「案件に参画する」）、
MD `<select>` ピッカーの撤去を扱う。

---

## 1. 位置付け（Pre-Check）

このレポートは「**事前診断（Pre-Check）**」として動作する：

- AI が勝手に意思決定するためのスコアではない
- 人間が参画する**前に**、ノート資産（MD）と要件の整合性を可視化する
- 結果として、参画後のオンボーディングを加速し、ミスマッチを減らす

UI は「案件に参画する」CTA の上に置かれ、視覚的に「読む → 進む」の流れを作る。

---

## 2. ライブラリ — `@/lib/compatibility-report`

### 2.1 入出力

```ts
buildCompatibilityReport({
  ownedMds: ReadonlyArray<OwnedMd>,
  project:  Project,
  githubSignals?: GitHubSignals,
}): CompatibilityReport

interface CompatibilityReport {
  percent: number;        // 0..100
  matched: number;
  total: number;
  contextSentence: string;
  fulfilled: string[];    // ["md_observability(A)", ...]
  unfulfilled: string[];  // ["md_infra_go", ...]
  bonus?: string;
}
```

### 2.2 percent の出処

`computeMatchingScore(ownedMds, project).score` をそのまま採用。Match Score
サイドバーと完全一致するので、ユーザーは同じ数字を 2 か所で見ることになる。

### 2.3 contextSentence の生成

`pickTopMatchTag(ownedMds, project)` が

1. `pickBestFitMd` で AI Pre-select した MD を取り出す
2. その MD で覆える要件のうち最高 weight、ties は `label.localeCompare` で安定化
3. その要件の `label`（例：`可観測性設計`）を返す

該当タグがあれば：

> 「あなたの知能（MD）はこのプロジェクトの「<label>」と高い親和性があります」

無ければ：

> 「現状、十分な親和性は確認できません。MD を増やすか、関連トピックの登記を進めてください。」

### 2.4 fulfilled / unfulfilled / bonus

- `fulfilled`: 既存 `matchDetails` の `matched=true` 行を `${reqId}(${ownedRank})` に整形
- `unfulfilled`: `missingMds.map(m => m.id)`
- `bonus`: `githubSignals.recentActivity && commitCount >= 10` のときのみ
  `あなたの GitHub 活動が直近 +${commitCount} commits`

### 2.5 サンプル出力（テストでも検証）

```
{
  percent: 100,
  matched: 3,
  total: 3,
  contextSentence: "あなたの知能（MD）はこのプロジェクトの「可観測性設計」と高い親和性があります",
  fulfilled: ["md_observability(S)", "md_infra_go(A)", "md_slo_policy(B)"],
  unfulfilled: [],
  bonus: undefined,
}
```

---

## 3. UI — `<CompatibilityReportSection>`

### 3.1 配置

`/projects/[id]` の右サイドバー（モバイル・PC とも縦読み）の最上部に近いところ。
既存セクションの順番：

1. ヘッダ／タイトル／Match Score（既存）
2. **Intelligence Compatibility Report**（新）
3. **Connected Intelligence Assets**（既存）
4. Apply（**「案件に参画する」**）
5. Net Payout
6. Competition

### 3.2 視覚仕様

| 要素 | 仕様 |
|------|------|
| 外枠 | `rounded-2xl border border-white/10 bg-[#162035] border-l-4 border-l-cyan-400 p-5 sm:p-6 mb-4` |
| `role` | `region` |
| `aria-labelledby` | `compat-h` |
| 見出し | `Intelligence Compatibility Report`（white semibold、`id="compat-h"`） |
| 適合率 | `text-cyan-400 metric-prime tabular-nums` ＋ `Compatibility 81%` |
| サブ | `text-slate-400 text-xs` ＋ `マッチ X / Y 件` |
| 1 行コピー | `data-testid="compat-context-sentence"` ／ slate-200 leading-relaxed |
| 位置付けキャプション | slate-400 leading-relaxed `max-w-prose` |
| 充足要件ピル | `bg-emerald-500/15 text-emerald-300 ring-emerald-400/30` |
| 未充足ピル | `bg-rose-500/10 text-rose-300 ring-rose-400/30` |
| ボーナスピル | `bg-cyan-500/15 text-cyan-300 ring-cyan-400/30` |
| ヘルプ | 右上に `?` ＋ `aria-describedby="compat-h"` ＋ title="事前診断（Pre-Check）：実際の参画前に、ノート資産と要件の整合性を可視化します。" |

### 3.3 アクセシビリティ

- 見出し `id="compat-h"` ／ `<section role="region" aria-labelledby="compat-h">`
- 各ピルに `aria-label` を付与（読み上げ時に意味が伝わる）
- 数値は tabular-nums で 375px でも改行しない

---

## 4. CTA 簡素化（「案件に参画する」）

| 項目 | 値 |
|------|-----|
| ラベル | 案件に参画する |
| `aria-label` | 案件に参画する |
| アイコン | lucide `LogIn`（CTA）／ `CheckCircle2`（参画済み） |
| ローディング | `参画中...` |
| 完了状態ラベル | 参画済み |
| 完了状態 `aria-label` | 参画済み |
| 配色 | cyan-400 塗り → 完了で `bg-emerald-500/10 ring-emerald-400/40 text-emerald-300` |
| 永続化キー | `localStorage["pluggedIn:[projectId]:[guildId]"]` ※既存と互換 |

### 4.1 MD `<select>` ピッカーの撤去

旧 UI ではユーザーが MD を選んでいたが、Mercari-style "no-input" UX に
合わせて撤去。代わりに `pickBestFitMd` が選んだ MD を **読み取り専用カード**で

```
この知能で参画します
md_observability [A]
自動でおすすめを選択しました — 1 件の要件に合致
```

と表示する（`data-testid="apply-readonly-md"`）。MD の自由選択は
オーナーシップ管理画面（v1.5+）に移譲する。

---

## 5. jargon-lint 差分

### 許可語（#122）
- 案件に参画する
- 参画済み
- この知能で参画します
- Intelligence Compatibility Report
- Compatibility
- 適合率
- 充足要件
- 未充足
- 事前診断
- Pre-Check

### スコープ付き NG
- `aria-label="知能をプラグイン"` ／ `aria-label="知能をプラグイン（案件に参画）"`
  — primary CTA では不可。本文・モーダル・ドキュメントには現れて OK
- 既存 NG（`aria-label="エージェントをデプロイ"`／資産で応募する／プラグイン応募／この案件に応募する／signup 系／キャラクター系）は継続

---

## 6. テスト一覧（Compatibility Report Update）

| テスト | 件数 | 場所 |
|--------|------|------|
| compatibility-report | 7 | `src/lib/compatibility-report/__tests__/compatibility-report.test.ts` |
| compatibility-report-page | 8 | `src/lib/__tests__/compatibility-report-page.test.ts` |
| apply-cta-copy（差し替え） | 5 | `src/lib/__tests__/apply-cta-copy.test.ts` |
| plug-in-flow（参画済み 文言整合） | — | `src/lib/__tests__/plug-in-flow.test.ts` を更新 |
| jargon-lint scope（知能をプラグイン aria-label 禁止） | +1 | `src/lib/__tests__/jargon-lint.test.ts` |

合計 **15 件以上**（新規ファイル 2 個 = 15 件、既存ファイル 2 件は文言整合）。
