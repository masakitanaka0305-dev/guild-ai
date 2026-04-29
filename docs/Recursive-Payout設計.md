# Recursive-Payout 設計 — 祖先への自動分配（Intelligence Ledger #90）

## 概要

`src/lib/recursive-payout/` は API 呼び出し 1 回ごとに **祖先 guildId へ幾何級数的に
報酬を分配**するエンジン。深さ 1 が 50%、2 が 25%、以降 2 の累乗で逓減し、
MAX_DEPTH=20 まで最大 99.9% を分配する。

---

## 重み関数

```
weightForDepth(d):
  d = 1 → 0.5
  d = 2 → 0.25
  d ≥ 3 → 0.25 / 2^(d-2)

totalWeightUpToDepth(20) ≥ 0.999
```

---

## 精度

分配額は **milli-JPY（0.001 円単位）** で管理。
表示は 0.01 円（2 桁）に丸める。
整数演算で `Math.floor` を使い浮動小数点誤差を排除。

---

## 分配アルゴリズム（BFS レイヤー分割）

```
入力: leafGuildId, totalMilliJpy, parentMap (optional)
  parentMap が未指定 → getLedger() から動的構築

for depth = 1 to MAX_DEPTH (=20):
  layerBudget = floor(total * weightForDepth(depth))
  nodes = BFS で depth 層のノード群
  各ノードに floor(layerBudget / nodes.length) を付与
  端数はリードノードに加算
  amountMilliJpy = 0 のノードはスキップ
```

---

## データ型

```typescript
interface PayoutRecipient {
  guildId: string;
  depth: number;
  amountMilliJpy: number;  // 整数
  weight: number;
}

interface PayoutRecord {
  id: string;
  leafGuildId: string;
  totalMilliJpy: number;
  recipients: PayoutRecipient[];
  ts: string;
}
```

---

## API

| 関数 | 説明 |
|------|------|
| `payoutOnApiCall(leafId, total, parentMap?)` | 1 回の API 呼び出しに対して分配を実行し PayoutRecord を返す |
| `getPayoutHistory(leafId?, limit=10)` | 分配履歴を返す（leafId 省略時は全件） |
| `getPayoutDisplayEntries(guildId, limit=10)` | 表示用エントリ（決定論的モックあり） |
| `weightForDepth(d)` | 深さ d の重み（テスト / デバッグ用） |
| `totalWeightUpToDepth(n)` | 深さ 1〜n の重みの合計 |
| `_resetPayoutHistory()` | テスト専用リセット |

---

## Shima-Ledger 連携

`payoutOnApiCall` は各受取人の `amountMilliJpy` を
`src/lib/shima-ledger` に記帳する（残高管理は Shima 側）。

---

## パフォーマンス

深さ 100 のリニアチェーンでも MAX_DEPTH=20 により打ち切り、
実行 10ms 未満（実測 1ms 以下）。

---

## 関連ファイル

- `src/lib/recursive-payout/index.ts` — 実装本体
- `src/lib/shima-ledger/` — 残高台帳
- `src/lib/__tests__/intelligence-ledger.test.ts` — 4 テスト
- `src/app/asset/[id]/page.tsx` — 自動分配履歴テーブル
