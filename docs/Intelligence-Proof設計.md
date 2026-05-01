# Intelligence Proof — Grading × Signature × Confidentiality

> 「鑑定」「真正」「機密」の三つで、知能の証明を完結させる。

このドキュメントは The Intelligence Proof Update（#120）の設計仕様。
新規ライブラリ `@/lib/grading` `@/lib/intelligence-signature`
`@/lib/confidentiality-filter` `@/lib/intelligence-balance` `@/lib/leaderboard`
と、それらを束ねる UI 群（Hex Rank Badge、鑑定中→Reveal、Intelligence
Balance、Leaderboard、Earn Details Modal、知能の断片カード）を扱う。

---

## 1. Intelligence Grading（公式）

`gradeIntelligence({ mdText, headings?, hasRunningCode?, githubSignals? })` が
`{ rank, total, subLabel, breakdown }` を返す。

### 1.1 三つの柱

| 柱 | 計算式 | 上限 |
|----|--------|------|
| **Structure** | `mdText.length ≥ 2,000` で +50、`h2 ≥ 3` で +30、`h3 ≥ 5` で +20 | 100 |
| **Density** | 技術用語 30 語＋ビジネス用語 20 語の出現回数 ÷ 文字数 × 1000 × 6（実用域に合わせた倍率） | 100 |
| **Consistency** | `commitCount` で 0/20/40/60、`recentActivity` で +20、`topics` × MD オーバーラップで +5 ずつ（最大 +20）。`githubSignals` 未指定なら中立 50 | 100 |

### 1.2 総合とランク決定

```
total = round(structure * 0.4 + density * 0.4 + consistency * 0.2)
```

| 条件 | rank | sub-label |
|------|------|-----------|
| `total ≥ 85` | **S (Legend)** | 伝説級。市場価値トップ1% |
| `total ≥ 70` | **A (Expert)** | 即戦力。エージェント派遣の主力 |
| `total ≥ 50` | **B (Core)** | 堅実な基盤。信頼性の高い知能 |
| `total < 50` | **D (Seed)** | 育成枠。ポテンシャルを秘めた種 |

`hasRunningCode === false` の場合、上記スコアを問わず **D へ強制ダウン** ／
recipe-gate と同じ責務分離を維持。

### 1.3 ランクの色トークン

| Rank | Tier | Fill | Tailwind text utility |
|------|------|------|------------------------|
| S | Legend | `#FDE047` | `text-[#FDE047]` |
| A | Expert | `#22D3EE` | `text-cyan-400` |
| B | Core   | `#34D399` | `text-emerald-400` |
| D | Seed   | `#94A3B8` | `text-slate-400` |

`<HexRankBadge rank={r} size={n} showSubLabel?>` で描画。`role="img"`、
`aria-label="${rank}ランク ${RANK_SUB_LABEL[rank]}"`。

### 1.4 サンプル出力（テストから抜粋）

| ケース | rank | total | breakdown |
|--------|------|-------|-----------|
| S 例（>=2,000 chars + 6 h2 + 8 h3 + 40 hits + 200 commits + recent + topics） | S | ≥ 85 | structure 100 / density ≈ 80 / consistency ≈ 90 |
| A 例（>=2,000 chars + 4 h2 + 6 h3 + 18 hits + 40 commits + recent） | A | 70–84 | structure 100 / density ≈ 50 / consistency 60 |
| B 例（>=2,000 chars + 3 h2 + 5 h3 + 7 hits、signals なし） | B | 50–69 | structure 100 / density ≈ 18 / consistency 50 |
| D 例（hasRunningCode=false） | D | — | recipe-gate により強制 |

---

## 2. Intelligence Signature（真正性証明）

`@/lib/intelligence-signature` が登記時に MD 末尾へ追記する署名フッタ。

### 2.1 Hash 仕様

- 関数：`djb2Hex(s)` — djb2 ハッシュを 8 桁 zero-padded hex で出力
- 入力：`${mdText}::${authorHandle}` — 著者ハンドルがダイジェストに混入
- 暗号学的強度はなし（display ID 用途）。tamper-evidence は
  `recipe-gate` ＋ チェーン公証を別途用いる

### 2.2 Footer 形式

```
（本文）

---
Intelligence Signature: <hash> | <iso8601>
```

- `signMd(mdText, authorHandle, { now? })` は **冪等** — 既に署名済みなら
  そのまま返し、既存の hash／timestamp をパースして返す
- `/asset/[id]/report` の最下段に **真正性証明**カードとして hash と timestamp を表示

### 2.3 サンプル

```
Intelligence Signature: 1b9c4f7d | 2026-05-01T00:00:00.000Z
```

---

## 3. Confidentiality Filter（企業向けマスキング）

`@/lib/confidentiality-filter` が企業プレビュー画面で機密情報を `[REDACTED]` に置換。

### 3.1 マスク対象

| 種別 | パターン |
|------|----------|
| メール | `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}` |
| 電話 | `(?:\+\d{1,3}[ -]?)?(?:\d{2,4}[- ]?){2,3}\d{3,4}`（日本＋E.164） |
| 個人名 | 漢字 1–3 + 半角／全角スペース + 漢字 1–3 |
| 会社／個人辞書 | 呼び出し側が `companies` ／ `persons` で渡す配列を verbatim にマッチ |

### 3.2 出力

```ts
maskForEnterprise(mdText, opts) →
  { text: string, redactionCount: number }
```

純関数。`text` は `[REDACTED]` 置換後の MD、`redactionCount` は処理した件数。
`/business/checkout/preview/[id]` で「N 件の機密情報をマスクしました」を表示。

### 3.3 例（Before/After）

```
（before）
担当: 田中 雅基 (Acme Robotics 社)
連絡: foo.bar@example.co.jp / 03-1234-5678

（after — companies=["Acme Robotics"]）
担当: [REDACTED] ([REDACTED] 社)
連絡: [REDACTED] / [REDACTED]

redactionCount = 4
```

---

## 4. Onboarding 鑑定中 → Reveal

| Route | 役割 |
|-------|------|
| `/onboarding/grading/[handle]/[repo]` | **静的 3 秒**。`bg-[#0B1121]` 全画面、中央に「鑑定中...」白 32px ＋ 「Analyzing your Intelligence」slate-400 14px ＋ シアン濃淡の 3 ドット（**点滅なし**）。3 秒後に `router.replace('/onboarding/draft/[owner]/[repo]?reveal=1')` |
| `/onboarding/draft/[owner]/[repo]?reveal=1` | 既存のドラフト画面の最上部に **Rank Reveal カード**を追加。`<HexRankBadge size=80 showSubLabel />` ＋ 静的 box-shadow グロー。`gradeIntelligence` を入力済みドラフトに対して計算してランクを決定 |

`role="status"` ／ `aria-live="polite"`、アニメは禁止（`animate-*` 不使用）。

---

## 5. Intelligence Balance（予測印税）

`@/lib/intelligence-balance` の `predictRoyalty({ rank, density, category? })` が
中央値・保守値（×0.6）・楽観値（×1.5）の三点を返す。

| Rank | 月額ベース |
|------|-----------|
| S | ¥80,000 |
| A | ¥32,000 |
| B | ¥12,000 |
| D | ¥3,000  |

`density` は 0..100 で ±25% を中央値に乗じる。`category` 倍率：
ml-pipeline 1.20 / rag-design 1.25 / agent-arch 1.15 / infra-go 1.10 など。

`aggregateRoyalty(items)` が複数 MD の合計を返す。`/profile` のステータス
タブ最上部に「予測印税（月額シミュレーション）」cyan `metric-prime` で表示。
レンジは「保守 ¥X 〜 楽観 ¥Y」slate-400 small。

---

## 6. Leaderboard `/leaderboard` — 伝説の知能ギルド

`@/lib/leaderboard` の `getSRankLeaderboard()` が **S ランク 10 件**（モック）を
`cumulativeJpy` 降順で返す。各行は

- 左：行番号（slate-500 mono）
- 中央：`<HexRankBadge rank="S" size={48} />`
- 右：handle / 知能タイトル / カテゴリ
- 末尾：累計報酬 cyan `metric-prime`

クリックで `/profile/[handle]` へ。AppShell の desktop フッタ帯に
`伝説 →`（`#FDE047/90` テキスト）リンクを追加。

---

## 7. Earn Details Modal

`<EarnDetailsModal>` を `/guild` の「収益の仕組みを見る →」cyan テキストリンクから起動。

- `role="dialog"` ＋ `aria-modal="true"` ＋ Esc 閉じ ＋ 背景クリック閉じ
- 見出し：「あなたの知能はどう収益を生むか」
- 3 ステップ：
  1. 企業が案件で必要な MD を AI が自動マッチング
  2. あなたの **エージェントが派遣**され、企業のプロジェクトに参加
  3. 実行結果に応じてマイクロペイメント（**0.001 JPY 単位**）が累積
- 「Intelligence Balance を見る」（cyan ring）→ `/profile` ／ 「閉じる」（cyan 塗り）

---

## 8. /profile — Phase H レイアウト

最上部：`<HexRankBadge size=80 showSubLabel />` ＋ ハンドル ＋ コピー、`border-l-4 border-l-cyan-400/30` のシェル感。

タブ構成（既存）：

| Tab | 中身 |
|-----|------|
| ステータス | Intelligence Balance ＋ 収益サマリ ＋ プロ識別バッジ |
| 登記済み MD | **「知能の断片」カード**（`bg-[#162035]` ＋ `border-l-cyan-400/30` ＋ タイトル白セミボールド ＋ guildId モノスペース ＋ 3 行サマリ） |
| 活動履歴 | 社会インパクト ＋ グローバル着金 ＋ オリジナリティ ＋ 自己紹介 |

---

## 9. テスト一覧（Intelligence Proof）

| テスト | 件数 | 場所 |
|--------|------|------|
| grading | 7 | `src/lib/grading/__tests__/grading.test.ts` |
| hex-rank-badge-v2 | 4 | `src/lib/__tests__/hex-rank-badge-v2.test.ts` |
| intelligence-signature | 4 | `src/lib/intelligence-signature/__tests__/intelligence-signature.test.ts` |
| confidentiality-filter | 2 | `src/lib/confidentiality-filter/__tests__/confidentiality-filter.test.ts` |
| onboarding-grading-wait | 2 | `src/lib/__tests__/onboarding-grading-wait.test.ts` |
| intelligence-balance | 3 | `src/lib/intelligence-balance/__tests__/intelligence-balance.test.ts` |
| leaderboard | 4 | `src/lib/leaderboard/__tests__/leaderboard.test.ts` |
| earn-details-modal | 2 | `src/lib/__tests__/earn-details-modal.test.ts` |
| profile-knowledge-fragments | 2 | `src/lib/__tests__/profile-knowledge-fragments.test.ts` |

合計 **30 件** の Intelligence Proof 新規テスト。

---

## 10. jargon-lint

新規許可語：「鑑定中／Analyzing your Intelligence／Intelligence Balance／予測印税／伝説の知能ギルド／Hall of Fame／知能の断片／真正性証明／Legend／Expert／Core／Seed／Confidentiality Filter」。

継続 NG：Signup・Sign up・サインアップ・会員登録・無料登録（全 UI）／Intelligence Deck 配下の 登録／資産で応募する／プラグイン応募／この案件に応募する／kawaii・shimaenaga 等のキャラクター系。
