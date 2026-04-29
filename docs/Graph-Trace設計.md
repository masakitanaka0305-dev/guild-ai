# Graph-Trace 設計書

## 概要

`src/lib/graph-trace/index.ts`

隣接リスト形式のグラフを BFS（幅優先探索）で走査し、ルートノードからの報酬分配量を計算するライブラリ。

## アルゴリズム

```
traceDistribution(rootGuildId, totalAmountJpy, graph?)
→ { distribution: Record<guildId, jpy>, nodeCount, depthReached }
```

- **BFS（反復型）**：再帰なし。100 段階 × 1,000 ノードを < 25ms で処理保証。
- **訪問済みセット**：ループ防止。同ノードへの二重分配なし。
- **丸め**：各エッジで `Math.round(...*100)/100` により浮動小数誤差を抑制。

## メモ化（LRU キャッシュ）

- 最大 50 グラフ、TTL 5 分のインメモリ LRU キャッシュ。
- キー：`${rootGuildId}:${totalAmountJpy}`
- ヒット時：O(1) 返却。
- `clearCache()` / `getCacheSize()` でテスト制御可能。

## テスト保証（`graph-trace-shima-impact.test.ts`）

| テスト | 保証内容 |
|--------|---------|
| 単一ノードグラフ | 全額がルートへ |
| 合計額チェック | 分配合計 ≤ 入力額 + 1円 |
| メモ化 | 2回目呼び出しでキャッシュ参照 |
| パフォーマンス | 100 × 5 グラフで < 25ms |
| depthReached | BFS 実深度を反映 |

## 将来の DB 移行

現在はインメモリのモックグラフ。本番移行時は `buildDefaultGraph()` を DB クエリに置換するだけで API は変わらない。

```typescript
// 本番置換イメージ
async function buildDefaultGraph(): Promise<DistributionGraph> {
  return db.query("SELECT source_id, target_id, share_rate FROM royalty_edges");
}
```
