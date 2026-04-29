# Persistence Protocol 設計書

## 概要

`src/lib/persistence-protocol/index.ts`

一度引用された MD が削除されても、引用している「子孫 MD」への報酬分配が止まらないための「アセット永続化プロトコル」。

## Tombstone（論理削除）

```typescript
tombstone(guildId, reason, authorHandle)
→ TombstoneRecord
```

- **物理削除なし**：tombstone はグラフから MD を除かず `status: "tombstoned"` を付けるだけ。
- 子孫ノードの lookup は引き続き可能（BFS は通過）。
- `reason`: `"deleted-by-author"` | `"dmca"` | `"expired"`

## 分配フォールバック規約

tombstoned ノードに割り当てられる金額の再ルーティング優先順位：

| 優先度 | 条件 | 受領先 |
|-------|------|--------|
| 1 | 著作者ハンドルが判明 | 著作者の shima-ledger へ |
| 2 | 著作者不明 / `"index-fund"` | インデックス基金に積立 |

## インデックス基金

- `getIndexFundBalance()` で現在残高を取得。
- 本番では定期的に active クリエイターへ再分配する仕組みに移行予定。

## distributeWithFallback

```typescript
distributeWithFallback(rootGuildId, amountJpy, graph?)
→ { distribution, routedFrom, indexFundJpy }
```

- `routedFrom` に `{ tombstonedNode, recipient, amountJpy }[]` を含む。
- UI でハイライト可（永続化されていますバッジ）。

## UI

- `/asset/[id]` タイトル下に青い盾バッジ「永続化されています」を表示。
- 削除フロー ConfirmDialog：「削除しても、引用しているノートには影響しません。あなたへの分配はインデックス基金にリダイレクトされます。」

## テスト（`grand-launch.test.ts`）

| テスト | 保証内容 |
|--------|---------|
| tombstone | isTombstoned = true |
| resolveActiveLineage | tombstone/alive 分離 |
| index-fund fallback | orphan → 基金へ積立 |
| 生存ノード直接分配 | root に全額 |
