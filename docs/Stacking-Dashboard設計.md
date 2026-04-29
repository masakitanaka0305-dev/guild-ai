# Stacking Dashboard 設計 — /profile/stacking（Intelligence Ledger #90）

## 概要

`/profile/stacking` は自分の GUILD ノートが何人の創造を支えているかを
**SVG ネットワーク図**と**月次スタッキングバーチャート**で可視化するページ。

---

## レイアウト

```
/profile/stacking
├── 見出し：「知恵のスタッキング」
├── サマリー文：「{N}件の知恵が、{M}人の創造を支えています」（赤・太字）
├── SVG ネットワーク図（W=480, H=280）
└── 月次バーチャート（12ヶ月分、3〜5 セグメント）
```

---

## SVG ネットワーク図

### 構造

```
self node: (CX=240, CY=140) — 金色リング
Ring 1: 半径  90 — 最大 8 ノード
Ring 2: 半径 145 — 最大 10 ノード
Ring 3: 半径 195 — 最大 12 ノード
```

### アクセシビリティ

```html
<svg role="img" aria-labelledby="stacking-svg-title">
  <title id="stacking-svg-title">知恵のネットワーク：{N}件の繋がり</title>
  ...
</svg>
```

### RANK_COLORS

| Rank | Color |
|------|-------|
| S | `#D4AF37`（ゴールド） |
| A | `#E64545`（レッド） |
| B | `#2563EB`（ブルー） |
| C, D | `#6B7280`（グレー） |

---

## 月次スタッキングバーチャート

### データ構造

```typescript
interface StackingBarSegment {
  label: string;   // cite / fork / remix / extend / learn
  count: number;
  color: string;
}

interface StackingBarMonth {
  month: string;   // "Jan", "Feb", ...
  segments: StackingBarSegment[];
  total: number;
}
```

### 決定論的モック

`getStackingChartData(userId)` は djb2 + LCG で guildId からシードを生成し、
同一ユーザーに対して常に同じデータを返す（リロードしても変わらない）。

### SEGMENT_COLORS

| Kind | Color |
|------|-------|
| cite | `#2563EB` |
| fork | `#16A34A` |
| remix | `#9333EA` |
| extend | `#EA580C` |
| learn | `#0891B2` |

---

## サマリー計算

```typescript
const totalDescendants = getDescendants(userId).length;  // dep-ledger BFS
const distinctCreators = new Set(descendants.map(getCreatorOf)).size;
// "N件の知恵が、M人の創造を支えています"
```

---

## 関連ファイル

- `src/app/profile/stacking/page.tsx` — サーバーコンポーネント
- `src/lib/dep-ledger/` — BFS 祖先・子孫
- `src/lib/recursive-payout/` — 分配履歴連携（将来）
