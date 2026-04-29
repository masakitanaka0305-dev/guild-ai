# Citation Network 設計（C2C Intelligence Exchange #3）

## 概要

GUILD AI 上のノートが互いを引用・派生するグラフ構造を可視化する仕組み。
引用されるほど被引用数が増加し、師匠スコアや報酬乗数に反映される。

## グラフ構造

```typescript
interface CitationNode {
  id: string;
  handle: string;
  title: string;
  rank: "S" | "A" | "B";
  citationCount: number;
  forkCount: number;
  isSelf: boolean;
}

interface CitationEdge {
  id: string;
  source: string;  // node id
  target: string;  // node id
  type: "citation" | "fork";
}
```

### エッジタイプ

- **citation** — 直接引用（赤線 `#E64545`）
- **fork** — 派生・フォーク（金破線 `#D4AF37`）

## API

```typescript
import { getCitationGraph, addRespect, getRespectCount, _resetRespect } from "@/lib/citation-network";

const graph = getCitationGraph("demo-user");
// → { nodes: CitationNode[], edges: CitationEdge[] }

addRespect("student-handle", "teacher-handle");
getRespectCount("teacher-handle"); // → number
```

## 決定論性

`getCitationGraph(handle)` は `djb2(handle + "graph")` シードから完全決定論的なグラフを返す。
グラフサイズ: ノード 12、エッジ 15（デフォルト）。

## 循環依存の回避

`citation-network` は `master-reputation` を import しない。
依存方向: `master-reputation` → `citation-network`（一方向）。

`getTopMasters` は `master-reputation` 側にのみ実装。

## 尊敬（Respect）システム

- `addRespect(fromHandle, toHandle)` — 師匠への尊敬を記録
- 尊敬数はメモリ内に保持（セッションリセットで消える）
- `/community/citations` の「尊敬」ボタンから呼び出す

## UI

- `/community/citations` — SVG ラジアルレイアウトのネットワーク図
- ノードサイズは `citationCount` に比例
- ホバー/フォーカスでノード情報をツールチップ表示
- `tabIndex=0` でキーボードアクセシビリティ対応
- 師匠ランキングサイドバー（Top 10）

## ファイル

- `src/lib/citation-network/index.ts` — コアロジック
- `src/app/community/citations/page.tsx` — 可視化ページ
- `src/lib/__tests__/c2c-exchange.test.ts` — テスト（citation-network 3件）
