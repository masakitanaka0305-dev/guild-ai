# Insight Delta 設計

## 概要

`src/lib/insight-delta/index.ts` が提供する差分タグシステム。
汎用 AI の回答とプロノートの回答を比較して「価値のデルタ」を可視化する。

## データ構造

### DeltaTag

| フィールド | 型                    | 説明                     |
|----------|-----------------------|--------------------------|
| tag      | string                | 機械キー                  |
| label    | string                | 表示ラベル（日本語）        |
| tooltip  | string                | ツールチップ説明            |
| intensity | high / medium / low  | 差分の強度（バッジ色に反映） |

### DeltaCompare

- `generic.points` — 汎用 AI が返す典型的な回答（3 件）
- `pro.points` — このノートが提供する回答（3 件）
- `pro.differentiators` — 差別化タグ（2〜4 件）
- `pro.valueDeltaPct` — 汎用 AI 比の価値改善率（20〜80%）

## タグプール

| tag          | label        | intensity |
|-------------|--------------|-----------|
| error-handling | 現場のエラー対処 | high |
| regulation  | 業界規制への適合 | high |
| cost-opt    | コスト最適化    | medium |
| anonymize   | データ匿名化    | high |
| audit-log   | 監査ログ       | medium |
| edge-cases  | エッジケース対応 | medium |
| performance | パフォーマンス調整 | low |

## UI 表示

`/asset/[id]` の「プロの工夫」カード:
- 2カラムレイアウト（汎用 AI の回答 vs このノートの回答）
- 差別化タグを intensity 別の色で表示
- `role="meter"` で価値デルタのゲージを表示

## 設計原則

- 決定論的生成（djb2 + lcg）
- guildId によって異なるタグが選出される
- 差別化タグの重複は最大10回のリトライで回避
