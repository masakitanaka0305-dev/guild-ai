# Solution Catalog 設計

## 概要

B2B 向け AI エージェントパッケージを一覧・比較できるカタログ機能。
業種別・ROI 別に 10 種のパッケージを提供し、見積もりフローへ誘導する。

## 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/lib/solution-catalog/index.ts` | 静的カタログデータ + 3 関数 |
| `src/app/business/catalog/page.tsx` | パッケージカード一覧（1/2/3 列グリッド） |

## データ構造

```typescript
interface SolutionPackage {
  id: string;            // "pkg-001" ~ "pkg-010"
  title: string;
  summary: string;
  industries: Industry[];  // "金融" | "医療" | "小売" | "製造"
  includedMds: string[];   // GUILD-ID リスト
  roiMonthlyJpy: number;   // 月次 ROI（円）
  slaPct: 99.5 | 99.9;
  minTier: "team" | "enterprise" | "enterprise-plus";
}
```

## パッケージ一覧

| ID | タイトル | 業種 | 月次 ROI | 必要ティア |
|----|----------|------|----------|------------|
| pkg-001 | 請求書 PDF 自動仕分け | 金融・製造 | ¥1.2M | enterprise |
| pkg-002 | コールログ要約 → CRM | 小売・製造 | ¥850K | enterprise |
| pkg-003 | 営業メール ABM 化 | 製造・小売 | ¥620K | team |
| pkg-004 | 在庫予測 + 自動発注 | 製造・小売 | ¥2.4M | enterprise |
| pkg-005 | コンプラ チャットモニタ | 金融 | ¥3.5M | enterprise-plus |
| pkg-006 | 医療記録 OCR + 分類 | 医療 | ¥1.8M | enterprise-plus |
| pkg-007 | EC レビュー感情分析 | 小売 | ¥380K | team |
| pkg-008 | 契約書リスクチェック | 金融・製造 | ¥950K | enterprise |
| pkg-009 | 社内ナレッジ Q&A Bot | 製造・金融 | ¥560K | team |
| pkg-010 | 保険申請自動審査 | 金融・医療 | ¥2.1M | enterprise-plus |

## UI 設計

- レスポンシブグリッド: 1 列（sp）→ 2 列（sm）→ 3 列（lg）
- パッケージカード: タイトル / サマリー / 業種バッジ / ROI・SLA・MD 数 / 「見積もる →」CTA
- ティア色: team=青, enterprise=琥珀, enterprise-plus=紫
- 業種色: 金融=緑, 医療=ローズ, 小売=スカイ, 製造=オレンジ
- フッター CTA → `/business/presale`

## API

```typescript
getCatalog(): SolutionPackage[]
getPackage(id: string): SolutionPackage | null
getCatalogByIndustry(industry: Industry): SolutionPackage[]
```
