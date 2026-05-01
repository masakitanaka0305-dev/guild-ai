# Logic White × Intelligent Simplicity

> 「白い静けさの中で、最重要なアクションだけが Royal Blue で立ち上がる」。
> プロフェッショナル層（AIデザイナー／AI Ops Manager／AIPM）のために、
> 直感的な階層構造と WCAG AA 準拠のコントラストを両立する。

このドキュメントは Logic White Update（#125）の設計仕様。直前の Midnight
Logic（ダーク）から白基調のライトテーマへ **デフォルトを切替**し、
Midnight は `data-theme="midnight"` 隠しトグルとして残す。

---

## 1. パレット

| 役割 | Hex | 用途 |
|------|-----|------|
| `bg-base`         | **#F8FAFC** | 青みオフホワイト ／ ページの床 |
| `bg-surface`      | **#FFFFFF** | 純白 ／ カード本体 |
| `bg-elevated`     | `#F1F5F9`   | 薄 elevation ／ フォーム fill ／ ポップオーバー |
| `text-primary`    | **#0F172A** | スレート900 本文 |
| `text-muted`      | `#475569`   | スレート600 補足（白上で AA 8:1） |
| `text-on-primary` | `#FFFFFF`   | Royal Blue 上の白文字 |
| `ai-action`       | **#4F46E5** | Royal Blue (Indigo-600) — Primary CTA |
| `ai-flow`         | `#7C3AED`   | Violet-600 — 生成・多次元（バッジ／ピル限定） |
| `ai-success`      | `#059669`   | Emerald-600 — 正常稼働（ピル限定 AA-large） |
| `ai-warn`         | `#D97706`   | Amber-600 — 警告 |
| `ai-negative`     | `#DC2626`   | Red-600 — エラー |
| `border-subtle`   | `#E2E8F0`   | スレート200 ／ カード境界 |
| `border-strong`   | `#CBD5E1`   | スレート300 ／ 強調境界 |

太鼓判（rank badge）は別系統：
金 `#D4A437` ／ 銀 `#94A3B8` ／ 銅 `#B45309` ／ みならい `#94A3B8`。

---

## 2. テーマ切替（`data-theme`）

| 属性値 | パレット | デフォルト |
|--------|----------|------------|
| `logic-white`（または属性なし） | Logic White（白基調） | ✓ |
| `midnight`                       | Midnight Logic（深海ネイビー） | — |
| `water`（legacy）                | Logic White の alias | — |

切替は `<ThemeSwitch>`（lucide Sun／Moon）で、html `data-theme` を書き換え
＋ `localStorage["guild_theme"]` に永続化。SSR 初回は `logic-white` 固定で
レンダリングするので Hydration ズレが起きない（trick: 初回フレームは空ボタンを返し、
useEffect 後にアイコンを切替）。

CSS 変数の値だけが上書きされるので、Tailwind ユーティリティ
（`bg-midnight-base` ／ `text-text-primary` ／ `bg-ai-action` 等）は **どちらの
テーマでも同じクラス名のまま**。コンポーネント側に theme-aware ロジックは要らない。

---

## 3. UI 規範

### 3.1 Single Action per Screen

各画面で「最重要アクション」を 1 つ特定し、Royal Blue の Primary Button に：

| 画面 | Primary CTA |
|------|------------|
| `/`（Intelligence Deck）   | 自分の知恵を登記する |
| `/onboarding`              | 確認して進む |
| `/projects/[id]`           | この知恵を貸す（参加する） |
| `/guild`                   | 新しい知恵を出品する |
| `/mint`                    | この知恵を出品する |
| `/applications`（空状態）  | お困りごとを探す |
| `/admin/model-settings`    | 設定を保存して評価へ進みます |
| `/admin/ops`               | 対応します |

### 3.2 Clear Hierarchy

補助情報は `<details>` ／ アコーディオン ／ モーダルに退避：

- `/admin/model-settings` の 4 グループ（ベース／プロンプト／ガードレール／出力形式）は `<details open>` ベース
- `/asset/[id]` の API 仕様（curl）はアコーディオン折り畳み
- `/projects/[id]` の Net Payout の Rental 詳細は折り畳み

### 3.3 Stepper UI

`<PipelineStepper steps={...}>`：

- 3 状態：done（Royal Blue 塗り＋white text＋Check icon）／ active（白＋blue ring）／ todo（slate-100＋border-subtle）
- 連結線：到達済みは Royal Blue、未到達は border-subtle
- 用途：
  - `/admin/model-settings` の 学習 → 評価 → デプロイ
  - `/admin/ops` の 観測 → 検知 → 対応
  - `/profile` の MD カード詳細にも横展開可能

---

## 4. コンポーネント

| コンポーネント | クラス／ファイル |
|---|---|
| Primary Button   | `bg-[var(--color-ai-action)] text-white rounded-lg h-12 px-6 font-semibold` |
| Secondary Button | `bg-white text-[var(--color-ai-action)] border border-[var(--color-ai-action)] rounded-lg h-12 px-6` |
| Tertiary Link    | `text-[var(--color-ai-action)] underline-offset-4 hover:underline` |
| Card             | `.section-card` ＝ `bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-sm` |
| Form Field       | `bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] rounded-lg h-11 px-3` |
| KPI Number       | `metric-prime` ＋ `tabular-nums` ＋ `text-2xl font-bold` |
| `<PipelineStepper>` | `src/components/ui/PipelineStepper.tsx` |
| `<ThemeSwitch>`     | `src/components/ui/ThemeSwitch.tsx` |
| `<HexRankBadge>`    | rank fills retuned for white surface (#D4A437 / #94A3B8 / #B45309) |

すべてのインタラクティブ要素は最小 44px 高さ。focus ring は `outline-2
outline-[var(--color-ai-action)]`。

---

## 5. WCAG AA コントラスト計測

`@/lib/contrast` の `LOGIC_WHITE_PAIRS` で計測（実測値）：

| 組合せ | 比 | 評価 |
|--------|----|------|
| `bg-base × text-primary`     | **17.1 : 1** | ✓ AAA |
| `bg-surface × text-primary`  | **17.9 : 1** | ✓ AAA |
| `bg-surface × text-muted`    | **7.6 : 1**  | ✓ AAA |
| `ai-action × on-primary`     | **6.3 : 1**  | ✓ AAA |
| `ai-success × on-primary`    | **3.8 : 1**  | △ AA-large only |
| `rank-gold × text-primary`   | **7.8 : 1**  | ✓ AAA |

Emerald-600 の白文字は AA-large（3.0:1）のみ。**ピル／バッジ限定**で利用し、
本文や小文字には適用しない。Royal Blue は本文ボタン文字としても合格（6.3:1）。

---

## 6. Before / After 一覧

| 画面 | Before（Midnight Logic） | After（Logic White） |
|------|-------------------------|---------------------|
| `/`（Intelligence Deck） | `bg-[#0B1121]` 黒基調 ／ シアンの登記 CTA | `bg-[var(--color-bg-base)]` 白 ／ Royal Blue CTA |
| `/guild` | 深海ネイビーカード ／ シアン強調 | 純白カード ／ Royal Blue CTA ／ subtle slate borders |
| `/projects/[id]` | 黒上のシアン CTA「知恵をプラグインする」 | 白上の Royal Blue CTA「この知恵を貸す（参加する）」 |
| `/mint` | 4 ステップ Hexagon strip on dark | 同 stepper、Logic White 配色（白カード） |
| `/applications` | emerald pill on dark | emerald pill on white、cancel modal 「やめる」→「いいえ、戻ります」 |
| `/admin/model-settings`（NEW） | — | 4 グループ `<details>` form ＋ PipelineStepper ＋ Royal Blue 「設定を保存して評価へ進みます」 |
| `/admin/ops`（NEW） | — | 3 KPI ＋ 障害アラート（red banner）＋ 7 日トレンド SVG ＋ 観測→検知→対応 stepper ＋ Royal Blue 「対応します」 |

太鼓判：
- 旧 Midnight：金 `#FDE047`（ネオン）／ 銀 `#CBD5E1` ／ 銅 `#D2A06B`
- 新 Logic White：金 `#D4A437`（深ゴールド）／ 銀 `#94A3B8` ／ 銅 `#B45309`（深銅）

---

## 7. テスト一覧

| テスト | 件数 | 場所 |
|--------|------|------|
| logic-white-tokens         | 5 | `src/lib/__tests__/logic-white-tokens.test.ts` |
| logic-white-card-surfaces  | 2 | `src/lib/__tests__/logic-white-card-surfaces.test.ts` |
| pipeline-stepper           | 3 | `src/lib/__tests__/pipeline-stepper.test.ts` |
| model-settings             | 3 | `src/lib/__tests__/model-settings.test.ts` |
| ops-dashboard              | 3 | `src/lib/__tests__/ops-dashboard.test.ts` |
| polite-copy-sweep          | 4 | `src/lib/__tests__/polite-copy-sweep.test.ts` |
| logic-white-contrast       | 6 | `src/lib/contrast/__tests__/logic-white-contrast.test.ts` |
| 既存 water-tokens / water-theme / midnight-logic-tokens / rank-friendly-labels | 13 | 各テストを Logic White に追従更新 |

合計 **26 件** の Logic White 新規 ＋ 13 件の既存差し替え。

---

## 8. jargon-lint

英語の色名（Logic White ／ Royal Blue ／ Midnight Logic ／ Stepper ／
Single Action）は **ドキュメント・コメント・識別子では許可**、**ユーザー
向け UI 表示には出さない**。`Rezon` ／ `レゾン` は引き続き NG。
