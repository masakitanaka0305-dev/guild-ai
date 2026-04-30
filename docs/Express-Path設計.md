# Express Path 設計

> 3 分以内に初回利益確定までを完結する高速オンボーディング仕様書

## 概要

GitHub を扱う優秀層が、コンテキスト性の高い MD ファイルを読み込み → 格付け → 運用開始 → 
**初回印税（First Royalty）が通帳に記録されるまで** を **3 分以内**に体験できる Express Path。

既存の Onboarding Express（6ステップ、8.5s）を拡張し、
First Royalty 擬似発火と Confirmed 祝祭バッジを追加した **7ステップ**フロー。

## 7 ステップと所要時間

| # | ステップ ID | ラベル | 目的 | UI 想定時間 |
|---|------------|--------|------|------------|
| 1 | `connect` | GitHub 接続 | OAuth 認証（モック） | 0.8s |
| 2 | `select-repo` | リポジトリ選択 | 対象 MD リポジトリの特定 | 0.5s |
| 3 | `analyze` | AI コンテンツ解析 | MD 抽出・分類 | 3.2s |
| 4 | `validate` | Validation Score 確定 | S/A/B ランク・スコア算出 | 2.1s |
| 5 | `publish` | Asset Ledger 登記・公開 | エンドポイント発行・Marketplace 掲載 | 1.4s |
| 6 | `first-royalty` | First Royalty 待機 | AtoA 取引の初回発火を待機（30〜60s） | 30〜60s |
| 7 | `confirmed` | 3分以内に利益確定 | 祝祭バッジ・紙吹雪演出 | 0.8s |

**合計: 38〜68 秒（中央値 ~53 秒）— 180 秒未満を 100 シードで保証**

## First Royalty 擬似発火ルール

```typescript
// 発火タイミング: djb2(seed) % 30001 + 30000 (ms)
// → 30s〜60s の間で決定論的に発火

const FIRST_ROYALTY_JPY = { S: 420, A: 180, B: 60 };
```

- **S ランク**: ¥420
- **A ランク**: ¥180
- **B ランク**: ¥60

発火元: income-stream / AtoA エンジンの擬似取引（モック）
通帳演出: PayoutToast スタイルのカード（+¥◯ 緑色）

## TimerBar 仕様

```
| 状態 | バー色 | 説明 |
|------|--------|------|
| 進行中 | 青 (bg-blue-500) | 経過 / 180s |
| 3分超過 | 赤 (bg-red-500) | 予算超過 |
| 達成 | 緑 (bg-green-500) | 3分以内完了 |
```

- 右端に赤い縦線（3分ラインマーカー）
- `motion-reduce:animate-none` で紙吹雪フォールバック（fade のみ）

## 3 分約束の根拠と限界

**達成根拠**:
- 7ステップの UI 合計は ~53s（中央値）
- First Royalty はモック擬似発火（本番での実際の AtoA 購入は非保証）
- 100 シードでの最大 total: ~69s < 180s

**限界**:
- 本番環境ではネットワーク遅延・Vercel コールドスタート・GitHub API レート制限で変動あり
- First Royalty は完全なモック（実際の決済は行われない）
- AtoA 取引の実発火タイミングは需要に依存（保証できない）

## 露出ポイント

| ページ | 露出形式 |
|--------|---------|
| `/` ヒーロー | 「投稿する」横サブテキスト「3 分で利益確定まで →」`/onboarding?fast=1` |
| `/projects/[id]` Rental パネル | 「この案件用の Express Path で開始 →」リンク |
| `/onboarding?fast=1` | fast モード: デモ URL 自動セット + first-royalty ステップ 3s に短縮 |

## fast=1 モード

`?fast=1` クエリパラメータで:
1. デモ URL `https://github.com/demo/express-demo` を自動入力
2. 300ms 後に自動スタート
3. `first-royalty` ステップの duration を 40s → 3s に短縮（デモ体験用）

## メトリクス

`src/lib/metrics/express.ts`:
- `recordExpressRun(handle, seconds)` — append-only
- `getMedianRunSeconds()` — p50
- `getP95RunSeconds()` — p95

`/admin/metrics`:
- 直近 100 件の中央値・p95・3 分達成率・ログテーブル

## ガードレール

- 反検知機能（shadow-for-employer 等）は追加しない
- 同意フロー: Express Path 開始前にも /legal/terms + /legal/transfer へのリンクを明示
- 本番の IP 帰属・NDA 遵守は ToS 第2条のユーザー責任
