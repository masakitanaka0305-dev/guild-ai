# Magic Guild — 設計書

Magic Guild フェーズ（#69）で実装した `/bank`（シマエナガ銀行）・`/jobs`（案件ボード）・`/guild`（武器庫）の設計記録。

詳細設計は以下を参照：
- `docs/Petal-Logic設計.md`（Magic Guild UI/UX 設計）

---

（kawaii / pro / midnight テーマは削除済み。nameraka 単一テーマ）

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

### 新機能
- **0秒換金オファー**：S/A ランク判定時に `amount = clamp(score × 800, 5000, 500000)` を即時提示
- **適合率計算**：`computeFit(jobId, ownedRecipeIds)` → 0-100
- **FloatingPayoutToast**：おだちん着金時の右下スライドイン通知（aria-live="polite"）
- **useRoyaltyStream**：API 印税 2件/分の擬似発火、通帳に反映
- **市場の熱量バー**：ホームの直近 5 分取引パルス（1.8s 更新）
- **＋のこす FAB**：モバイル中央固定、デスクトップ右下 oval ボタン
