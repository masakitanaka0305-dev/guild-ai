# Global Settlement Layer 設計書

## 概要

`src/lib/global-settlement/index.ts`

世界中の通貨・AI エージェントからの支払いを即座に JPY 換算し、lineage 系譜分配を通じてエンジニアの端数残高（shima-ledger）へ着金させる最終決済層。

## 通貨換算表（モック）

| 通貨 | レート（対 JPY） |
|------|----------------|
| JPY | 1 |
| USD | 152.4 |
| EUR | 165.2 |
| GBP | 192.8 |

## 知能指数（knowledgeIndex）

```
knowledgeMultiplier(index) = 1 + min(100, index) * 0.0025
// 0 → ×1.00 (bonus 0%)
// 100 → ×1.25 (bonus 25%)
```

`knowledgeIndex` = demand-forecast スコア + rank 係数の合成（0–100 正規化）。

## settle シーケンス

```
1. amount × FX_RATES[currency] → rawJpyEq
2. rawJpyEq × knowledgeMultiplier → totalJpyEq
3. distributeWithFallback(lineageRoot, totalJpyEq) → distribution
4. 各受領者: accumulate(handle, jpyToMilli(amountJpy))  ← shima-ledger
5. 履歴: SettlementRecord に記録（最大 100 件）
```

## UI

### /profile「グローバル着金」セクション

- 直近 24h の 4 通貨別流入（375px で縦 2×2 / 768px〜 で横 4 列）
- 合計 JPY 換算（ゴールド）
- 最新 5 件のリスト（`<ol>`）：通貨バッジ + payerType + 着金額

### /guild 通帳の通貨タグ

- 決済行に `aria-label="通貨: USD"` 付き小型バッジを表示。

## テスト（`grand-launch.test.ts`）

| テスト | 保証内容 |
|--------|---------|
| FX 固定 | 3 通貨レート値 |
| USD 換算 | 10 USD → ≈ ¥1,524 |
| knowledge boost | +0〜25% 範囲 |
| 100 件 E2E | 合計一致（誤差 < 0.01） |
| 通貨別集計 | USD/EUR がそれぞれ > 0 |
| JPY 直接 | ≈ 入力額（index 0） |
