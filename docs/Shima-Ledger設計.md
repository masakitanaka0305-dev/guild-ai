# Shima-Ledger 設計書

## 概要

`src/lib/shima-ledger/index.ts`

ミリ円（1/1,000 円）精度のマイクロウォレット。API 印税など端数額を蓄積し、閾値到達で自動出金する。

**UI 上の表記：「端数残高」**（内部モジュール名 `shima-ledger` は維持）。
**「シマエナガ通帳」という文言は UI に一切表示しない**（jargon-lint FORBIDDEN に追加済み）。

UI 上は「運用 → 総資産カード → 端数残高」として統合表示。

## データモデル

```typescript
interface MicroBalance {
  totalMilliJpy: number;  // 内部保持値（ミリ円）
  displayJpy: number;     // 表示用（÷ 1000）
  threshold: number;      // 自動出金ライン（¥1,000 / ¥3,000 / ¥10,000）
  autoWithdraw: boolean;  // 自動出金 ON/OFF
}
```

## 主要 API

| 関数 | 説明 |
|------|------|
| `accumulate(handle, milliJpy)` | 残高に加算。autoWithdraw ON + 閾値超過で自動出金 |
| `getMicroBalance(handle)` | 現在残高取得 |
| `triggerWithdraw(handle)` | 即時出金（残高リセット） |
| `setAutoWithdraw(handle, bool)` | 自動出金 ON/OFF |
| `setThreshold(handle, jpy)` | 出金ラインを変更 |
| `formatMilliJpy(milliJpy)` | `¥1,234.567` 形式フォーマット |

## UI コンポーネント（`MicroWalletPanel.tsx`）

- `/guild` ページの TotalAssetsCard 直下に配置
- 端数残高の残高表示（`aria-live="polite"`）
- 進捗バー（`role="progressbar"` + `aria-valuenow/min/max`）
- 出金ラインセレクタ（¥1k / ¥3k / ¥10k）、localStorage 永続（UI 側で実装）
- 自動出金トグル（`role="switch"`）
- 「いま出金する」手動ボタン（残高 > 0 時のみ表示）

## テスト（`graph-trace-shima-impact.test.ts`）

| テスト | 保証内容 |
|--------|---------|
| 端数精度 | 1.5 JPY = 1500 ミリ円 |
| 積算 | accumulate 複数回で加算 |
| 出金リセット | triggerWithdraw 後残高 0 |
| 自動出金発火 | 閾値超過で残高リセット |
| displayJpy フォーマット | ¥記号・カンマ含む |
| OFF 時非発火 | autoWithdraw OFF で積算のみ |
| ミリ↔円 逆変換 | milliToJpy(jpyToMilli(x)) === x |
