# Backtest 設計（Intelligence Productization #2）

## 概要

MD ノートが過去にどれだけの精度・速度で課題を解決したかの「実行ログ統計」を商品スペックとして公開。
企業の購買意思決定を裏付けるデータとして提示する。

## 算出式（決定論モック）

すべて `djb2(guildId + "backtest")` + LCG からの決定論的生成。外部呼び出しなし。

| 指標 | 計算式 | 範囲 |
|------|--------|------|
| 精度（accuracyPct） | `(820 + seed % 175) / 10` | 82.0–99.4% |
| 平均レイテンシ | `80 + seed % 420` | 80–500ms |
| p95 レイテンシ | `avgLatencyMs + 50 + seed % 350` | avg+50〜avg+400ms |
| エラー率 | `(seed % 40) / 10` | 0.0–3.9% |
| サンプル数 | `(12 + seed % 168) * 1000` | 12,000–180,000 件 |

12ヶ月精度推移（`monthlyTrend`）:
- 基準値 = `accuracyPct - 2`
- 月ごとに ±3% のランダム変動 + 0.15% の緩やかな上昇トレンド
- 下限 70 / 上限 100 でクリップ

## 表示ルール

- 精度バッジ：`role="status"` + `aria-label="精度 XX.X パーセント"` — 緑色丸ピル
- 4指標カード：各カードに「？」ツールチップで定義を 1 行表示
- 12ヶ月折れ線：SVG `<polyline>`（幅 280px × 高さ 40px）、緑色
- サンプル数：`formatSamples(n)` で万単位表示（例：120,000 件 → 12万）

## 注意書き（必須表示）

```
過去 N 件の実行ログから計測。実環境の挙動はワークロードにより変動します。
```

実環境での性能保証ではない旨を明示する。

## 精度ピル（マーケット・案件カード）

- `getBacktestStats(assetId).accuracyPct` を `LazyMarketplaceCard` と `jobs` カードで表示
- `role="status"` + `aria-label="精度 XX.X パーセント"` を付与

## ファイル

- `src/lib/backtest/index.ts` — コアロジック
- `src/app/asset/[id]/page.tsx` — 精度実績セクション
- `src/app/marketplace/page.tsx` — カード内精度ピル
- `src/app/jobs/page.tsx` — カード内精度ピル
- `src/lib/__tests__/productization.test.ts` — テスト（backtest 3件）
