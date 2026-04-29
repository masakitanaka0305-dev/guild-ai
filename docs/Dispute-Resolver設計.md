# Dispute Resolver 設計（#99 Autonomous Operator）

## 概要

GUILD AI 上での支払い・品質・権利・剽窃トラブルを AI が自動審査し、
多くの案件を人手不要で24時間以内に解決する紛争解決エンジン。

## 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/lib/dispute-resolver/index.ts` | 紛争ロジック本体 |
| `src/app/disputes/page.tsx` | `/disputes` フロントエンド |

## クレーム分類

| ClaimType | 内容 | デフォルト解決方針 |
|-----------|------|--------------------|
| `payment-dispute` | 支払いトラブル | エスクロー記録照合 |
| `quality-dispute` | 品質クレーム | AI 審査スコアと実稼働ログ照合 |
| `ownership-dispute` | 権利トラブル | オリジン署名とコミット履歴照合 |
| `plagiarism` | 剽窃申告 | Originality Watch スコアで判定 → **常に creator-wins** |

## 判定ロジック

```typescript
// plagiarism は常にクリエイター側の勝訴
if (claimType === "plagiarism") return "creator-wins";

// その他: djb2(claimType:guildId:claimantHandle) % 4 でバケット
const verdicts: ResolutionVerdict[] = [
  "creator-wins", "buyer-wins", "split", "escalated"
];
return verdicts[seed % 4];
```

決定論的なので、同じ内容のクレームは常に同じ判定になる。

## 状態遷移

```
open → autoResolve() →
  verdict = "escalated" → status: "escalated" (人手審査)
  verdict = others      → status: "auto-resolved"
```

## ID 体系

- 紛争 ID: `dsp_0001`, `dsp_0002`, ...（`_counter` で連番）

## テスト保証

`src/lib/__tests__/autonomous-operator.test.ts` の dispute-resolver セクション（6テスト）:
- openDispute → `dsp_` プレフィクス + status:"open"
- autoResolve → auto-resolved/escalated に遷移
- plagiarism → 常に creator-wins
- getDisputes → ハンドル別フィルタ
- getDisputeById → 未知 ID で null
- 決定論的判定（同一入力 → 同一結果）
