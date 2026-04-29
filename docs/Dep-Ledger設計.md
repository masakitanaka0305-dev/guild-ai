# Dep-Ledger 設計 — 権利の系譜（Intelligence Ledger #90）

## 概要

`src/lib/dep-ledger/` は GUILD AI における **append-only 依存エッジ台帳**。
一度記録した `cite` / `fork` 関係は変更も削除も不可能で、Merkle Hash Chain により
改ざんを検出できる。

---

## データ構造

```typescript
interface LedgerEdge {
  id: string;          // "edge_0", "edge_1", ...（インデックス連番）
  child: string;       // 子 guildId
  parent: string;      // 親 guildId
  kind: EdgeKind;      // "cite" | "fork"
  ts: string;          // ISO 8601
  hash: string;        // djb2(id+child+parent+kind+ts) → 8桁 hex
  merkleHash: string;  // hashOf(prevMerkleHash + hash)、genesis = "00000000"
}
```

---

## API

| 関数 | 説明 |
|------|------|
| `appendEdge(input)` | エッジを追記。`ts` 省略時は `new Date().toISOString()` |
| `getLedger()` | 全エッジの ReadonlyArray |
| `verifyChain()` | Merkle Chain を検証。`{ valid, firstBrokenIndex }` |
| `getDescendants(rootId)` | BFS 下降。rootId の全子孫 guildId 配列 |
| `getAncestors(guildId)` | BFS 上昇。guildId の全祖先 guildId 配列 |
| `shortHash(guildId)` | 8文字 hex バッジ用ハッシュ |
| `_resetLedger()` | テスト専用リセット（本番コード不使用） |

**意図的に `removeEdge` は存在しない**（append-only 設計原則）。

---

## Merkle Hash Chain

各エッジ追記時に計算:

```
genesis: merkleHash[0] = hashOf("00000000" + hash[0])
i ≥ 1:   merkleHash[i] = hashOf(merkleHash[i-1] + hash[i])
```

`verifyChain()` は全エッジを再計算し、格納値と不一致があれば
`{ valid: false, firstBrokenIndex: N }` を返す。

---

## BFS 実装

```
getDescendants(root):
  queue = [root], visited = Set([root])
  while queue not empty:
    current = queue.shift()
    for each edge where edge.parent === current:
      if !visited(edge.child): enqueue, add to result

getAncestors(leaf):
  queue = [leaf], visited = Set([leaf])
  while queue not empty:
    current = queue.shift()
    for each edge where edge.child === current:
      if !visited(edge.parent): enqueue, add to result
```

---

## セキュリティ特性

- ReadonlyArray として外部公開（TypeScript レベル）
- `_resetLedger` は `export` されているが名前規約で用途明示
- Merkle Chain により事後改ざんが検出可能（在庫としての台帳整合性）

---

## 関連ファイル

- `src/lib/dep-ledger/index.ts` — 実装本体
- `src/lib/__tests__/intelligence-ledger.test.ts` — 4 テスト
- `src/app/asset/[id]/page.tsx` — `shortHash` を権利バッジに利用
