# Composite Intelligence SDK 設計（C2C Intelligence Exchange #2）

## 概要

複数の GUILD ノートを直列・並列につなぎ、**一つの巨大な集合知**として動作させる開発キット。
`compose([id1, id2, id3]).run(payload)` の一行で複数ノードのパイプラインが走る。

現在はプレビュー版（モック実装）。実際の HTTP コールは発生しない。

## API

```typescript
import { compose, runComposite, PIPELINE_STEPS, getCompositeNodeTitles } from "@/lib/composite";

// 同期実行（UI用）
const result = runComposite(["GUILD:0001-INVOICE", "GUILD:0007-NORMALIZE"], { pdf: "file.pdf" });
// → { output: "処理完了：...", steps: [...], nodeCount: 2, totalMs: 1234 }

// 非同期ジェネレータ（ステップバイステップ）
const pipe = compose(ids);
for await (const step of pipe.run(payload)) {
  console.log(step.label, step.partial); // "Connecting", "ドキュメントを解析中…"
}
```

## パイプラインステップ（5段階）

1. **Connecting** — ノードへの接続確立
2. **Loading** — 知識グラフのロード
3. **Running** — タスク実行
4. **Composing** — 出力の合成
5. **Done** — 完了・クリーンアップ

## 決定論性

`runComposite` は `djb2(ids.join("") + "output")` シードから完全決定論的な出力を返す。
同一 ID セットで何度呼んでも同じ `output` 文字列が得られる（テスト可能）。

## 報酬分配

各パイプラインの実行時、参加ノードの作成者それぞれに `1/nodeCount` 比例で報酬が分配される。
（実装は `src/lib/global-settlement` の `knowledgeMultiplier` と連動予定）

## UI

- `/sdk` ページ — パイプライン擬似実行デモ、5ステップアニメーション付き
- サンプルコード表示（ダークテーマ `<pre>` ブロック）
- 「今すぐ試す」ボタン → `PipelineModal`

## ファイル

- `src/lib/composite/index.ts` — コアロジック
- `src/app/sdk/page.tsx` — デモページ
- `src/lib/__tests__/c2c-exchange.test.ts` — テスト（composite 4件）
