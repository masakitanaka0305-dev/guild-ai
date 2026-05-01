# Midnight Logic — Pro-tier Design Tokens

> 「深い知性とプロ仕様のコックピット」。
> 静寂と鋭さを両立、WCAG AA 準拠の意味論的トークン体系。

> **アップデート：Logic White Update（#125）以降、本パレットは
> `data-theme="midnight"` の隠しトグル用。デフォルトは Logic White**
> （`docs/Logic-White設計.md`）。CSS 変数名は同一なので、コンポーネントは
> どちらのテーマでも同じユーティリティを利用できる。

このドキュメントは Midnight Logic Update（#124）の設計仕様。AI デザイナー／
AI Ops Manager／AIPM などプロ層が長時間滞在するダッシュボードを支える
ベース色／テキスト／アクション／ステータスのセマンティック トークンを
一元化する。

---

## 1. パレット

| 役割（Role） | Hex | ブランド名（内部呼称のみ） | 用途 |
|------|------|---------------------------|------|
| `bg-base`        | **#0F172A** | Deep Space Blue   | コックピットの床。`<body>` 背景／フルスクリーン surface |
| `bg-surface`     | **#1E293B** | Cockpit Surface   | カード／パネル／モーダル本体 |
| `bg-elevated`    | **#293548** | Elevated Panel    | ポップオーバー／メニュー／浮上要素 |
| `text-primary`   | **#F8FAFC** | Off-white         | 本文／見出し |
| `text-muted`     | `#94A3B8`   | Slate Mute        | 補足／ラベル |
| `text-on-primary`| **#0F172A** | On-primary Ink    | `bg-ai-action` 等の上の文字 |
| `ai-action`      | **#06B6D4** | Electric Cyan     | プライマリ CTA／フォーカスリング／active タブ |
| `ai-flow`        | **#8B5CF6** | Electric Violet   | 生成・多次元・Cross-functional タグ（バッジ／ピル限定） |
| `ai-success`     | **#10B981** | Neon Mint         | live／OK／emerald ピル |
| `ai-warn`        | `#F59E0B`   | Amber             | 警告 |
| `ai-negative`    | `#E64545`   | Negative Red      | エラー |
| `border-subtle`  | rgba(248,250,252,0.10) | Subtle Border | カードの outline |
| `border-strong`  | rgba(248,250,252,0.18) | Strong Border | フォーカス内部・選択強調 |

### 例外（独立トークン）

太鼓判（rank badge）の色は別系統：金 `#FDE047` ／銀 `#CBD5E1` ／銅 `#D2A06B`。
`@/lib/grading` の `RANK_COLOR_TOKEN` で管理。

---

## 2. CSS 変数（globals.css の正本）

```css
:root {
  /* Backgrounds */
  --color-bg-base:        #0F172A;
  --color-bg-surface:     #1E293B;
  --color-bg-elevated:    #293548;

  /* Text */
  --color-text-primary:    #F8FAFC;
  --color-text-muted:      #94A3B8;
  --color-text-on-primary: #0F172A;

  /* AI / Action / Status */
  --color-ai-action:      #06B6D4;
  --color-ai-flow:        #8B5CF6;
  --color-ai-success:     #10B981;
  --color-ai-warn:        #F59E0B;
  --color-ai-negative:    #E64545;

  /* Borders */
  --color-border-subtle:  rgba(248,250,252,0.10);
  --color-border-strong:  rgba(248,250,252,0.18);
}
```

旧 `--water-*` ／ `--n-*` は **alias 化**（後方互換）：

```css
--water-bg:      var(--color-bg-base);
--water-surface: var(--color-bg-surface);
--water-accent:  var(--color-ai-action);
--water-text:    var(--color-text-primary);
--water-muted:   var(--color-text-muted);
--water-divider: var(--color-border-subtle);
```

---

## 3. Tailwind ユーティリティ

`tailwind.config.ts` の `colors` 拡張：

```ts
midnight: { base: "#0F172A", surface: "#1E293B", panel: "#1E293B", elevated: "#293548" },
ai:       { action: "#06B6D4", flow: "#8B5CF6", success: "#10B981", warn: "#F59E0B", negative: "#E64545" },
text:     { primary: "#F8FAFC", muted: "#94A3B8" },
water:    { ... },  // legacy alias mirroring midnight
```

主要クラス：

| ユーティリティ | 用途 |
|----------------|------|
| `bg-midnight-base`    | フルスクリーン surface |
| `bg-midnight-surface` | カード／モーダル本体 |
| `bg-ai-action`        | プライマリ CTA |
| `bg-ai-success/15`    | 成功ピル背景 |
| `text-text-primary`   | 本文 |
| `text-text-muted`     | 補足 |
| `text-text-on-primary`| CTA 上の文字 |
| `border-ai-action/30` | 入力フィールド枠 |
| `outline-ai-action`   | フォーカスリング |

---

## 4. 旧 → 新 対応表（移行ガイド）

| 旧（直書き） | 新（セマンティック） | Tailwind |
|---|---|---|
| `bg-[#0B1121]`   | `var(--color-bg-base)`         | `bg-midnight-base` |
| `bg-[#162035]`   | `var(--color-bg-surface)`      | `bg-midnight-surface` |
| `bg-[#0F1827]`   | `var(--color-bg-base)`         | `bg-midnight-base` |
| `bg-[#22D3EE]`   | `var(--color-ai-action)`       | `bg-ai-action` ／ `bg-cyan-400` |
| `text-[#22D3EE]` | `var(--color-ai-action)`       | `text-ai-action` |
| `text-[#0B1121]` | `var(--color-text-on-primary)` | `text-text-on-primary` |
| `text-[#E2E8F0]` / `text-[#F1F5F9]` | `var(--color-text-primary)` | `text-text-primary` |
| `text-[#94A3B8]` | `var(--color-text-muted)`      | `text-text-muted` |
| `border-[#22D3EE]/30` | `var(--color-ai-action) at 30%` | `border-ai-action/30` |
| `stroke-[#22D3EE]` | `var(--color-ai-action)`     | `stroke-ai-action` |

太鼓判 (rank badge) の `#FDE047` / `#CBD5E1` / `#D2A06B` は 別系統として維持。

---

## 5. WCAG AA コントラスト計測

`@/lib/contrast` の `contrastRatio(fg, bg)` で計測。**全ての主要組合せが
4.5:1 以上**（AA 通常テキスト）を満たす：

| 組合せ | 比 | 評価 |
|--------|----|------|
| `bg-base × text-primary`     | **17.1 : 1** | ✓ AAA |
| `bg-base × text-muted`       | **7.0 : 1**  | ✓ AAA |
| `bg-surface × text-primary`  | **14.0 : 1** | ✓ AAA |
| `ai-action × on-primary`     | **7.4 : 1**  | ✓ AAA |
| `ai-success × on-primary`    | **7.0 : 1**  | ✓ AAA |
| `ai-flow × on-primary`       | **4.2 : 1**  | △ AA-large only |

**Violet (ai-flow) は本文に使わない。** バッジ／ピル／タグ など UI 要素
（AA 大文字／非テキスト）限定。本文に紫を使う場合は `text-violet-300`
（明るめ）を採用する。

テスト：`src/lib/contrast/__tests__/contrast.test.ts` の 11 件で計測値
を pin する（ホワイト/ブラック 21:1、6 主要組合せ、`MIDNIGHT_PAIRS`
スイープ）。

---

## 6. Alias 化した旧変数

下記は廃止せず **互換 alias として維持**：

| 旧変数 | 解決先 |
|--------|--------|
| `--water-bg`       | `var(--color-bg-base)` |
| `--water-surface`  | `var(--color-bg-surface)` |
| `--water-surface-2`| `var(--color-bg-elevated)` |
| `--water-accent`   | `var(--color-ai-action)` |
| `--water-text`     | `var(--color-text-primary)` |
| `--water-muted`    | `var(--color-text-muted)` |
| `--water-divider`  | `var(--color-border-subtle)` |
| `--n-bg` ／ `--n-text` 等 | `[data-theme="water"]` 内で water-* に redirect、water-* が color-* に解決 |

新規コードは **必ず `--color-*` ／ `bg-midnight-*` ／ `bg-ai-*` ／
`text-text-*` を使用**する。alias は移行期間中の互換用。

---

## 7. テスト一覧（Midnight Logic）

| テスト | 件数 | 場所 |
|--------|------|------|
| midnight-logic-tokens | 3 | `src/lib/__tests__/midnight-logic-tokens.test.ts` |
| midnight-card-surfaces | 3 | `src/lib/__tests__/midnight-card-surfaces.test.ts` |
| contrast (utility + AA gate) | 11 | `src/lib/contrast/__tests__/contrast.test.ts` |
| 既存 water-tokens / water-theme（差し替え） | 4 + 8 | `src/lib/__tests__/water-{tokens,theme}.test.ts` |

合計 **17 件** の Midnight Logic 新規 ＋ 12 件の既存差し替え。

---

## 8. jargon-lint

英語の色名（Electric Cyan ／ Electric Violet ／ Neon Mint ／ Deep Space
Blue ／ Midnight Logic ／ Cockpit Surface）は **ドキュメント・コメント・
識別子では許可**。**ユーザー向け UI 表示には出さない**（カラーパレット名
はブランド内部呼称に留める）。

`Rezon` ／ `レゾン` は引き続き NG（仮称不採用）。
