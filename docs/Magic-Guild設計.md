# Magic Guild — 設計書

Magic Guild フェーズ（#69）で実装した `/bank`（シマエナガ銀行）・`/jobs`（案件ボード）・`/guild`（武器庫）の設計記録。

詳細設計は以下を参照：
- `docs/Petal-Logic設計.md`（Magic Guild UI/UX 設計）
- `docs/Friendly-Bank設計.md`（kawaii テーマ詳細）

---

## Terminal Theme への昇華（#71）

### 背景

Friendly Bank（kawaii テーマ）を一旦デフォルトとして実装したが、ターゲットユーザー（日本のトップエンジニア）の要件分析から「硬派なプロフェッショナル・ツール」への方針転換を決定。

### 変更概要

| 旧（kawaii デフォルト） | 新（terminal デフォルト） |
|---|---|
| シマエナガ銀行 | 資産運用ターミナル |
| 案件ボード（クエスト） | Engagement Terminal |
| 武器庫 | Portfolio |
| 登録（出品） | Lodge |
| 金貨ジャラジャラ・紙吹雪 | Gold Flash Bar（0.1s） |
| シマエナガ常駐ガイド | Golden Seal（鑑定済み証のみ） |
| コイン落下・丸い装飾 | 表組み・等幅フォント・CSS変数 |

### テーマ切替

- デフォルト: `terminal`（`data-theme="terminal"` を `<html>` に設定）
- kawaii テーマは ThemeToggle から選択可能（後方互換維持）
- `localStorage.guild_theme` に永続化

### 保持するもの（kawaii テーマ）

kawaii テーマでは既存の Friendly Bank UI を完全保持。ThemeToggle で切替可能。

- ShimaenagaGuide（右下固定ガイド）
- CoinRain・Confetti アニメーション
- RankBadge（金/銀/銅 friendly モード）
- useTactile（振動＋チャイム）
- 平易語コピー（「ぶき」「おたから」「えらんでもらう」等）

---

## Refinement v13: Intelligence-as-a-Transaction（なめらかテーマ）

### 背景

Terminal Theme（v12）は情報密度が高く、エンジニア以外には難解との判断から、**日本人ウケの良いなめらかな資産運用プラットフォーム**へ全面刷新。

### 変更概要

| 旧（terminal デフォルト） | 新（nameraka デフォルト） |
|---|---|
| `data-theme="terminal"` | `data-theme="nameraka"` |
| 等幅フォント / 4px 角丸 | SF Pro / Yu Gothic / 16px 角丸 |
| 高密度ターミナル UI | タイル型・縦カード・大型数値 |
| Engagement Terminal 表 | タイミー式縦カード + 適合率% |
| Portfolio 資産表 | マイ銀行 + おだちん + FloatingPayoutToast |

### テーマ階層
- `nameraka`：デフォルト（本仕様）
- `pro`：旧 terminal（エンジニア向け、隠しトグル）
- `kawaii`：Friendly Bank（子供向け、隠しトグル）

### 新機能
- **0秒換金オファー**：S/A ランク判定時に `amount = clamp(score × 800, 5000, 500000)` を即時提示
- **適合率計算**：`computeFit(jobId, ownedRecipeIds)` → 0-100
- **FloatingPayoutToast**：おだちん着金時の右下スライドイン通知（aria-live="polite"）
- **useRoyaltyStream**：API 印税 2件/分の擬似発火、通帳に反映
- **市場の熱量バー**：ホームの直近 5 分取引パルス（1.8s 更新）
- **＋のこす FAB**：モバイル中央固定、デスクトップ右下 oval ボタン
