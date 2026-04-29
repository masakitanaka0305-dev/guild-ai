# Social Proof of Impact 設計書

## 概要

`src/lib/impact/index.ts`
`src/components/ImpactCard.tsx`

プロフィールページで「どれだけのプロジェクトに貢献したか」を可視化するソーシャルプルーフ機能。

## 算出式

```typescript
savedProjects = floor(totalCalls / 55)
// totalCalls: 直近30日の全資産コール数合計
// 55: 1プロジェクトあたり平均55回利用の仮定

contributionScore = activeAssets * 1,000 + complexityScore * 38
// activeAssets: 運用中資産数
// complexityScore: 0-100 の複雑度スコア
```

### 典型値（demo-user）

| 指標 | 典型値 |
|------|--------|
| savedProjects | ~42 |
| contributionScore | ~6,820 |
| 今月ランク | #10〜#49 |
| 累計ランク | #200〜#399 |

## ランキング

- djb2 ベースの決定論的モック（本番は DB 集計に置換）
- 今月：`10 + (seed % 40)`、累計：`200 + (seed % 200)`
- ランク表示に `role="status"` を付与（スクリーンリーダー対応）

## ImpactCard UI

- `/profile` ページの「プロとしての実績」セクション直下に配置
- 上段 2 カード：「N プロジェクトを救った（赤）」「累積貢献スコア（ゴールド）」
- ランク行：「今月 #N ／ 累計 #N」(`role="status"`)
- シェアボタン：X シェア + コピー（compact モード相当）
- シェアテキスト例：
  ```
  GUILD AI で 42 プロジェクトに貢献しました！
  貢献スコア 6,820 / 今月ランク #18
  AIエージェントで、あなたの時間をアップデート。
  #GUILDAI
  ```

## テスト（`graph-trace-shima-impact.test.ts`）

| テスト | 保証内容 |
|--------|---------|
| 決定論 | 同一 handle で同一結果 |
| savedProjects 範囲 | > 0 かつ < 10,000 |
| contributionScore | > 0 |
