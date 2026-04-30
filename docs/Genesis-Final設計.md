# Genesis Final — 設計メモ

## 概要

GUILD AI の最終リリース仕様。Quick Listing（3 ステップ・10 秒）を中心に、3 タブナビ・Mercari 風売上ヒーロー・動的 OGP・Context Depth S 要件・スケルトン＋オフライン・Enterprise CTA フッター を一括実装。

---

## 1. Quick Listing（3 ステップ・10 秒）

`/onboarding`（デフォルト）

| ステップ | ID | 所要時間 |
|----------|----|----------|
| コンテンツ投入 | source | ユーザー操作 |
| AI 鑑定 | validate | 1,500 ms |
| 出品完了 | listed | 500 ms |

- `QUICK_BUDGET_MS = 10,000`（10 秒の予算表示）
- `/onboarding?detail=1` で旧 Express Path（8 ステップ・180 秒）にフォールバック
- 実装：`src/lib/quick-listing/index.ts`

## 2. 3 タブナビ（探す / 出す / 稼ぐ）

| タブ | URL | アイコン |
|------|-----|---------|
| 探す | /projects | search |
| 出す | /onboarding | plus |
| 稼ぐ | /guild | bank |

- `src/components/SidebarNav.tsx`：`role="tablist"` / `aria-selected`
- `src/app/page.tsx`：`redirect("/projects")`
- 実装：`src/lib/nav-config.ts`（MAIN_TABS）

## 3. Mercari 風売上ヒーロー（/guild）

- 総売上金 ¥1,248,400 を 36–48px ゴールドフォントで表示
- 3 ピル統計：今月予想 / 稼働中 MD / 累計コール
- "さらに稼ぐ →" CTA → /projects

## 4. 動的 OGP

| ルート | 内容 |
|--------|------|
| `/og/profile/[handle]/route.tsx` | ランク・スコア・累計収益 |
| `/og/asset/[id]/route.tsx` | ランク・タイトル・月収レンジ |

- Edge Runtime + `next/og` ImageResponse（1200×630）
- djb2 ハッシュで決定論的なデータ生成

## 5. Context Depth — Strict S 要件

S ランク条件に `contextDepth >= 4` を追加。

6 基準（各 1 点）：

| # | 基準 | キーワード例 |
|---|------|------------|
| 1 | 実装意図の明文化（why） | なぜ、because、why |
| 2 | 制約条件の列挙 | 制約、constraint |
| 3 | 非自明な落とし穴 | 落とし穴、gotcha |
| 4 | パフォーマンス議論 | パフォーマンス、latency |
| 5 | 検証手順・テスト | テスト、test、expect( |
| 6 | フォールバック挙動 | フォールバック、fallback |

実装：`src/lib/context-depth/index.ts`

## 6. スケルトン画面 + オフライン

- `loading.tsx`：/projects / /projects/[id] / /guild / /profile
- `public/sw.js`：stale-while-revalidate、/offline フォールバック
- `src/components/SwRegister.tsx`：Service Worker 登録
- `src/app/offline/page.tsx`：オフライン用フォールバックページ

## 7. Enterprise CTA フッター

- モバイル：AppShell のボトムナビ上に赤バンド
- デスクトップ：サイドバー下部リンク
- 遷移先：`/business/checkout`
