# Individual-Tier 設計（C2C Intelligence Exchange #1）

## 概要

GUILD AI の API 利用料を 3 段階のティア制で課金する仕組み。
個人クリエイターが自分のノートを外部に公開する際、呼び出し元のニーズに合った枠を選べる。

## ティア定義

| ティア | 月額 | 含まれる calls/月 | req/min | 商用 | 記録割合 |
|--------|------|------------------|---------|------|---------|
| Hobby | ¥0 | 1,000 | 60 | 不可 | 30% |
| Pro Indie | ¥1,980 | 50,000 | 600 | OK | 100% |
| Enterprise | 従量（¥0.03/call） | 無制限 | 6,000 | OK | 100% |

### 記録割合（recordedFraction）

Hobby ティアは `recordedFraction = 0.3`。  
収益計算に用いられる「実質コール数」が 30% に抑えられ、クリエイター報酬も減少する。
商用規約を守らせるための設計上の意図的制限。

## コアAPI

```typescript
import { getQuote, recommendPlan, getTierUsageBreakdown } from "@/lib/individual-tier";

// 見積もり
const q = getQuote("pro-indie", 12_000);
// → { totalJpy: 1980, overageCalls: 0, recordedFraction: 1.0, ... }

// プラン推薦
const plan = recommendPlan(500, "individual"); // → "hobby"

// /profile ドーナツチャート用
const breakdown = getTierUsageBreakdown(hobby, proIndie, enterprise);
```

## 超過料金

| ティア | 超過単価 |
|--------|---------|
| Hobby | ¥1.5 / call |
| Pro Indie | ¥0.04 / call |
| Enterprise | ¥0.03 / call（月額なし、全量従量） |

## UI

- `/asset/[id]` → `TryItNowButton` — ティア比較モーダル
- `/profile` → SVG ドーナツチャート（Hobby/Pro Indie/Enterprise の比率）
- 「ためしてみる」ボタンから Hobby の無料トライアル開始

## ファイル

- `src/lib/individual-tier/index.ts` — コアロジック
- `src/components/TryItNowButton.tsx` — アセット詳細ページのボタン
- `src/lib/__tests__/c2c-exchange.test.ts` — テスト（individual-tier 4件）
