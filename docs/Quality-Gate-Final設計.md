# Quality Gate Shima-Final 設計（#96 Anti-Failure Protocol）

## 概要

AI 生成コンテンツの氾濫を防ぐため、S ランク取得条件を「実稼働コードの証拠」と「テスト証跡」で強化。
思考密度・稼働日数・意思シグナルに加え、MD に実際のコードが含まれていることを機械的に検証する。

## 実装ファイル

`src/lib/ai-auditor/index.ts`

## 条件変更点（v1 → Shima-Final）

| 条件 | v1 | Shima-Final |
|------|----|-------------|
| 思考密度閾値 | ≥ 80 | ≥ 70（緩和） |
| 稼働日数 | ≥ 30 | ≥ 30（変更なし） |
| 意思シグナル数 | 1以上 | ≥ 3（厳格化） |
| 実稼働コード | なし | **必須** |
| テスト証跡 | なし | **必須** |

## `evaluateDepth(mdContent)`

```typescript
const RUNNING_CODE_PATTERNS = [
  /\bfunction\b/, /\basync\b/, /\bdef\b/, /\bclass\b/, /\bfn\s/
];
const TEST_EVIDENCE_PATTERNS = [
  /\btest\b/i, /\bverify\b/i, /\bexample\b/i, /output:/i
];
```

- `hasRunningCode`: 5パターン中 3つ以上マッチ
- `hasTestEvidence`: 4パターンのいずれかにマッチ

## ランク判定フロー

```
density≥70 AND uptime≥30 AND intentSignals≥3 AND hasRunningCode AND hasTestEvidence
  → S（魂の登記）

density≥70 AND uptime≥30 AND intentSignals≥3 AND (!hasRunningCode OR !hasTestEvidence)
  → A（コード/テスト不足）

density≥60 AND uptime≥7
  → A（標準品質）

その他
  → B（ベースライン）
```

## スコア計算

```
composite = 0.6 × thoughtDensity
          + 0.3 × min(uptimeDays, 60) / 60 × 100
          + 0.1 × (hasIntent ? 100 : 0)
```

最大値 100 でキャップ。

## なぜ「実稼働コード必須」か

AI が生成した説明文のみのノートが S ランクを取得するのを防ぐ。
実際に動くコードが含まれていることで「人間が設計・実装した知能」であることを機械的に担保する。
意思シグナル 3件以上（`author-statement` + `voice-intent` + `manual-edit` など）と組み合わせることで
「人間の意志 × 実装力」の両方を証明する。
