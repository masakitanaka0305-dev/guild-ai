# Master Reputation 設計（C2C Intelligence Exchange #4）

## 概要

GUILD AI 上の知識貢献者を「師匠」として評価する制度。
引用数・複雑度スコア・フォーク数から算出した **マスタースコア（0–1000）** で師匠ランクを決定する。

## スコア計算式

```
masterScore = min(1000,
  citationCount × 5      // 被引用（最大 ~250点）
  + complexityScore × 3  // 複雑度スコア（最大 300点）
  + forkCount × 6.67     // フォーク数（最大 ~100点）
)
```

### 師匠ランクラベル

| スコア範囲 | ラベル |
|-----------|--------|
| 700 以上 | マスター |
| 400 – 699 | シニア |
| 150 – 399 | メンター |
| 0 – 149 | コントリビューター |

## 集合知スコア（collectiveScore）

```
collectiveScore = round(
  (citationCount × 10 + forkCount × 15 + complexityScore × 8)
  × (masterScore / 1000 + 0.5)
)
```

スコアが高い師匠ほど乗数が大きくなり、貢献価値が加速度的に増える。

## API

```typescript
import { computeMasterScore, getMasterStats, getTopMasters, getRecommendedNotes } from "@/lib/master-reputation";

// 師匠スコア（数値のみ）
computeMasterScore("alice"); // → 342

// 全統計
getMasterStats("alice");
// → { handle, masterScore, citationCount, discipleCount, collectiveScore, label }

// ランキング上位N人
getTopMasters(10);
// → [{ handle, masterScore, label }, ...]

// 推薦ノート（3件）
getRecommendedNotes("alice");
// → [{ title, guildId }, ...]
```

## 弟子（discipleCount）

`citation-network` のエッジで `target === node_{handle}` となるエッジ数を弟子数とする。
弟子は直接的な引用者を意味する。

## 推薦ノート

`djb2(handle + "_recommend") % NOTES.length` で開始インデックスを決定し、
5つのノートプールから3件を順番に取り出す（決定論的）。
ハンドルが違えば異なる3件が返る。

## UI

- `/community/citations` — 師匠ランキングサイドバー（Top 10）+ 尊敬ボタン
- `/profile/[handle]` — 師匠スコアカード（被引用/弟子/集合知スコア）+ 「この師に学ぶ」モーダル
- `LearnFromMasterButton` — 推薦ノート3件を表示するクライアントコンポーネント

## ファイル

- `src/lib/master-reputation/index.ts` — コアロジック
- `src/components/LearnFromMasterButton.tsx` — モーダルコンポーネント
- `src/app/profile/[handle]/page.tsx` — 師匠スコアカード統合
- `src/lib/__tests__/c2c-exchange.test.ts` — テスト（master-reputation 3件）
