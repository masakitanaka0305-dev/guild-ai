# Zero-Day Feed 設計

## 概要

`src/lib/zero-day/index.ts` + `/feed/zero-day` + `ZeroDayToast` で構成される
リアルタイム技術変化アラートシステム。

## イベントカタログ（モック 6 件）

| id | タイトル | priority | status |
|----|---------|----------|--------|
| zd-pg18-migration | PostgreSQL 18 互換マイグレーション | critical | covered |
| zd-llm-token-limit | LLM API トークン上限変更 | high | recruiting |
| zd-my-number-2026 | マイナンバー法改正 2026 | critical | covered |
| zd-next15-breaking | Next.js 15 破壊的変更 | high | covered |
| zd-openai-api-v2 | OpenAI API v2 移行期限 | medium | recruiting |
| zd-cloud-run-cold-start | Cloud Run コールドスタート問題 | medium | recruiting |

## Subscribe API

```ts
subscribeZeroDay(callback)   // 5秒間隔で順番にイベントを配信
unsubscribeZeroDay(callback) // 購読解除
getZeroDayEvents(priorityOrder=true)  // critical → high → medium の順で返す
```

## ZeroDayToast コンポーネント

- 位置: `fixed bottom-[88px] left-4`（モバイル）/ `bottom-8`（デスクトップ）
- スタイル: aurora グラデーション（`#1A3A6B → #2D6BB5 → #B5860A`）
- `role="alert"` + `aria-live="polite"` でアクセシブル
- `localStorage[ZERO_DAY_OPTOUT_KEY] === "1"` の場合は表示しない
- CTA: recruiting → `/sell?topic=ZERO-DAY:{id}` / covered → `/feed/zero-day`
- 「非表示にする」ボタンで localStorage に optout を保存

## /feed/zero-day ページ

- 優先度順でイベントを全件表示
- ステータス: `対応MD公開中`（covered）/ `未学習 — 募集中`（recruiting）
- 募集中のイベントには「対応MDを出品する」CTA → `/sell?topic=ZERO-DAY:{id}`
- 法人向け CTA → `/business`

## /business ページ

- ゼロデイアラートの opt-in/opt-out トグル
- localStorage で `ZERO_DAY_OPTOUT_KEY` を制御
- 最新ゼロデイ 3 件のプレビュー

## /sell ページとの連携

- `?topic=ZERO-DAY:{id}` が渡された場合、出品フォーム上部にヒントバナーを表示
- 出品時にトピックと紐付けられることをユーザーに伝える

## optout キー

`localStorage` キー: `guild_zero_day_optout`
値: `"1"` の場合は Toast を非表示
