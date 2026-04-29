# Asset-Dopamine Suite 設計書

3 機能から構成される「資産を持つ喜び」を高めるエンゲージメント・レイヤー。

---

## 1. 想定収益シミュレーター（Revenue Simulator）

### 目的
投稿完了直後に「自分のノートがどれだけ稼ぐか」を可視化し、モチベーションを上げる。

### データモデル

```typescript
interface SimulatorInput {
  rank: "S" | "A" | "B";
  perCallJpy: number;    // floor_price / 10,000
  category: string;      // タイトルから推定
  ccafScore: number;     // デフォルト 72
}

interface SimulatorResult {
  monthlyMedianJpy: number;
  p10Jpy: number;
  p90Jpy: number;
  expectedCalls: number;
  distributionByDay: number[]; // length 30, sum ≈ monthlyMedianJpy
}
```

### アルゴリズム

```
expectedCalls = 5 × 30 × categoryFactor × rankCoeff × (1 + ccafScore/100)
monthlyMedianJpy = expectedCalls × perCallJpy
p10 = median × 0.35
p90 = median × 1.90
distributionByDay[i] = normalize(LCG(seed, i)) × monthlyMedianJpy
```

- カテゴリ係数：LLM/AI=1.8、TypeScript=1.4、Python=1.3、Rust=1.2、default=1.0
- ランク係数：S=3、A=2、B=1
- 決定論的（同入力→同出力）

### 配置
`/sell` の `CompletionCard` 内、「おしごと窓口」3カラムグリッドの直前。  
コンポーネント：`src/components/RevenueSimulatorCard.tsx`  
ライブラリ：`src/lib/revenue-simulator/index.ts`

---

## 2. グローバル収益ストリーム（Global Income Stream）

### 目的
1円未満の報酬発生でもリアルタイムに「祝祭感のある通知」を全ページで流す。

### データモデル

```typescript
interface IncomeEvent {
  recipeId: string;
  amountJpy: number;        // 0.05 ~ 4.8 JPY
  callerType: "agent" | "human" | "big-ai";
  ts: string;               // ISO 8601
}

interface IncomeStreamClient {
  subscribe(callback: (event: IncomeEvent) => void): void;
  unsubscribe(callback: (event: IncomeEvent) => void): void;
}
```

### 実装

- `src/lib/income-stream/index.ts`：`setTimeout` ベースの擬似ストリーム（800〜1500ms 間隔）
- `_fireForTest()` メソッドでテスト時に手動発火可能
- 将来 WebSocket に差し替え可能（`IncomeStreamClient` インターフェース）

### UI（IncomeStreamBar）

`src/components/IncomeStreamBar.tsx` — グローバル layout で常駐

| 金額 | 表示 |
|------|------|
| ≥ 1 円 | 赤バッジ 💴 `+¥X.X` |
| < 1 円 | 金バッジ ✨ `+¥0.XX` + 6粒子コンフェッティ（Canvas, 0.6s）|

- 最大 3 件スタック、各 1.6 秒滞在 → フェードアウト
- throttle: 全ページで 6 秒に 1 回
- `role="status" aria-live="polite"`
- `prefers-reduced-motion` 対応（フェードのみ、confetti スキップ）

---

## 3. 知能家系図（Lineage Graph）

### 目的
MD 間の依存関係と収益の分配経路を美しく可視化。

### データモデル

```typescript
interface LineageNode {
  id: string;
  guildId: string;
  title: string;
  rank: "S" | "A" | "B";
  monthlyJpy: number;
  type: "self" | "parent" | "child";
}

interface LineageLink {
  id: string;
  source: string;     // node.id
  target: string;
  shareRate: number;  // 視覚表示のみ（実分配は 100/0/0 のまま）
  monthlyFlowJpy: number;
}
```

> **注意**: 家系図上の `shareRate` は視覚化のためのレイヤーであり、  
> 実際の `distribute()` は変更なし（作成者 100%、プラットフォーム 0%）。

### モック生成（決定論的）

`getLineage(id)` — `src/lib/lineage/index.ts`
- 親（依存元）：3〜5 件（djb2(id) ベースで決定）
- 子（引用先）：4〜8 件
- 総ノード数：5〜20 の範囲

### ページ `src/app/lineage/[guildId]/page.tsx`

| 機能 | 実装 |
|------|------|
| ツリー表示（デフォルト） | 手動 SVG 座標計算（d3 不要） |
| 力学表示 | `d3-force` dynamic import（初期バンドル最小化） |
| エッジ粒子 | SVG `<animateMotion>` 金色ドット 60fps |
| ホバーツールチップ | React state（foreignObject） |
| キーボード操作 | ← → で隣接ノード移動 |
| reduced-motion | `animateMotion` 非表示（宣言的）|

### アクセシビリティ

- SVG 全体：`role="img"` + `<title>`
- ノード：`aria-label="タイトル ランクX 月収¥X"`
- キーボード：`tabIndex={0}` + ArrowKey ハンドラ

### 遷移元

- `/asset/[id]` → 「この知能の家系図を見る」赤テキストリンク
- `/guild` の運用中の資産テーブル → 🌳 アイコンボタン

---

## 依存追加

```json
"dependencies": {
  "d3-force": "^3.0.0",
  "d3-hierarchy": "^3.1.2",
  "d3-selection": "^3.0.0"
}
```

---

## テスト（9 件追加）

| # | テスト | ファイル |
|---|--------|--------|
| 1 | simulateRevenue 決定論的 | revenue-simulator.test.ts |
| 2 | p10 ≤ median ≤ p90 | revenue-simulator.test.ts |
| 3 | distributionByDay 長さ 30、合計 ≈ median | revenue-simulator.test.ts |
| 4 | subscribe でイベント受信 | income-stream.test.ts |
| 5 | unsubscribe で受信停止 | income-stream.test.ts |
| 6 | IncomeEvent の型形状検証 | income-stream.test.ts |
| 7 | IncomeStreamBar が aria-live="polite" を持つ | income-stream-ui.test.ts |
| 8 | getLineage 決定論的 | lineage.test.ts |
| 9 | node count 5〜20 | lineage.test.ts |
