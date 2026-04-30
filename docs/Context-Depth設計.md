# Context Depth — 設計メモ

## 目的

S ランク査定において「表面的な説明文」と「実装者の深い文脈」を区別するため、MD コンテンツの深度スコア（0–6）を導入する。

## アルゴリズム

```
score = sum(criteria.map(c => c.keywords.some(kw => md.toLowerCase().includes(kw)) ? 1 : 0))
```

- 各基準の任意のキーワードが 1 個でも含まれれば 1 点
- 最大 6 点
- `S_RANK_CONTEXT_DEPTH_MIN = 4`（4 点以上で S ランク候補）

## 6 基準

| # | label | 代表キーワード |
|---|-------|--------------|
| 1 | 実装意図の明文化（why） | なぜ、理由、because、why、purpose、rationale |
| 2 | 制約条件の列挙 | 制約、条件、constraint、limitation、requirement |
| 3 | 非自明な分岐・落とし穴 | 落とし穴、gotcha、caveat、pitfall、注意、warn |
| 4 | パフォーマンス／コスト議論 | パフォーマンス、o(、latency、performance、benchmark |
| 5 | 検証手順／テストの記述 | テスト、test、verify、expect(、assert |
| 6 | 失敗時の挙動／フォールバック | フォールバック、fallback、retry、catch、error handling |

## S ランク完全条件（all must be true）

```
density >= 70
&& uptime >= 30
&& intentSignals.length >= 3
&& hasRunningCode
&& hasTestEvidence
&& contextDepth >= 4
```

## 実装ファイル

- `src/lib/context-depth/index.ts` — `computeContextDepth(md)` → `{ score, met[], missed[] }`
- `src/lib/ai-auditor/index.ts` — S ランク条件に組み込み済み

## フィードバック文言

contextDepth が不足した場合の `audit()` フィードバック例：
```
"実装意図(why)・制約・落とし穴・テスト・フォールバックなど深い文脈を4項目以上記述するとSランクに近づきます"
```
