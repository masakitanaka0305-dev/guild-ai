# Production Marketplace 設計

> The Intelligence Marketplace & Execution Engine — 本番品質の取引プラットフォーム仕様書

## 概要

GUILD AI の Intelligence Marketplace は、AIナレッジ資産（MD）を案件（Project）に紐付け、スキルマッチング・エスクロー決済・実行証跡の一連フローを提供する。

## Phase B: /projects/[id] ルーティング

- `MOCK_PROJECTS` を基に `generateStaticParams()` で SSG プリレンダリング
- URL: `/projects/[id]` — `proj_001`〜`proj_006` の 6 案件
- `/jobs` → `/projects` 308 永続リダイレクト（`next.config.js`）

## Phase C: Matching Score

```
score = Σ(matchedReq.weight × ownedRankScore)
      / Σ(allReqs.weight × req.rankMinScore) × 100
```

- 0〜100 のパーセント値、ドーナツチャート SVG で表示
- `role="img"` / `aria-label="マッチ率 X%"` でアクセシブル
- `computeMatchingScore(ownedMds, project)` — `src/lib/matching/index.ts`

## Phase D: Timeline + Competition

- 4 ステップタイムライン: 応募 → 採択 → 実行中 → 精算
  - `<ol>` + `aria-current="step"`
- Competition カード: S/A/B ランク別応募者数（djb2 シードで決定論的）
  - `RANK_COLOR`: S=#E64545, A=#F59E0B, B=#3B82F6

## Phase E: DB Schema + Server Actions

### escrow_reserves テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| id | text PK | `esv_` prefix |
| project_id | text → projects.id | |
| applicant_handle | text | |
| md_rental_ids | jsonb | レンタルした MD ID 配列 |
| total_reserved_milli_jpy | bigint | ミリ円精度 |
| status | enum | pending→executing→settling→settled |
| created_at | timestamptz | |

### Server Actions (二重バリデーション)

1. `applyWithRental(projectId, handle, mdRentalIds)`
   - Zod スキーマ検証
   - `mdRentalIds` が project.requiredMdInterfaces に含まれるか確認
2. `submitDeliverable(projectId, escrowId, evidenceUrl)`
   - URL が `https://` 始まり
3. `releaseEscrow(projectId, escrowId)`
   - status === "settled" 確認後に精算

## ロールバックポイント

| フェーズ | 逆戻り手順 |
|---------|-----------|
| Phase B routes | `next.config.js` の redirects を削除 |
| Phase E schema | Drizzle migration でカラム DROP |
| Server Actions | `"use server"` ファイルを削除、クライアント側フォールバックへ |
