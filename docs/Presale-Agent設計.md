# Presale Agent 設計

## 概要

自然言語の課題テキストを入力として受け取り、最適な MD バンドル・価格・ROI 試算を返す
シマ事前提案エージェント。キーワードマッチングによる決定論的実装。

## 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/lib/presale-agent/index.ts` | 提案ロジック・価格算出 |
| `src/app/business/presale/page.tsx` | チャット風 UI（textarea → 1.2s → 結果カード） |

## 提案フロー

```
query (日本語テキスト)
  ↓
detectIndustry()   ← INDUSTRY_KEYWORDS マッチング
detectOperation()  ← OPERATION_KEYWORDS マッチング
  ↓
OPERATION_TO_PACKAGE で pkg 特定 (優先)
  ↓ (未ヒット時)
getCatalogByIndustry で ROI 上位パッケージを選択
  ↓ (さらに未ヒット時)
全カタログで ROI 最大パッケージ
  ↓
calcPricing: tier → 月額・初期費用
complianceTags: industry → 関連法令リスト
```

## キーワード辞書

### 業種キーワード
- 金融: 銀行、保険、証券、コンプライアンス、金商法 など 10 語
- 医療: 病院、カルテ、処方、患者、ヘルスケア など 10 語
- 小売: EC、通販、商品、レビュー、CRM など 10 語
- 製造: 工場、部品、ERP、在庫管理、サプライチェーン など 10 語

### オペレーションキーワード → パッケージマッピング
| オペレーション | 代表キーワード | パッケージ |
|--------------|--------------|-----------|
| ocr-invoice | 請求書、PDF、仕分け、OCR | pkg-001 |
| call-crm | コール、通話、CRM、Salesforce | pkg-002 |
| abm-email | メール、ABM、リード、営業 | pkg-003 |
| inventory | 在庫、発注、欠品、ERP | pkg-004 |
| compliance | コンプライアンス、モニタ、インサイダー | pkg-005 |
| medical-ocr | 医療記録、カルテ、電子カルテ、ICD | pkg-006 |
| review-analysis | レビュー、感情、スコア、EC | pkg-007 |
| contract | 契約書、NDA、リスク、法務 | pkg-008 |
| qa-bot | Q&A、ナレッジ、Bot、社内 | pkg-009 |
| insurance | 保険、申請、審査、クレーム | pkg-010 |

## 価格体系

| ティア | 月額基本料 | 初期費用 |
|--------|----------|---------|
| team | ¥98,000 | 無料 |
| enterprise | ¥298,000 | ¥300,000 |
| enterprise-plus | ¥598,000 | ¥800,000 |

## レスポンス型

```typescript
interface PresaleProposal {
  packageId: string | null;
  recommendedPackage: SolutionPackage | null;
  mdBundle: string[];          // GUILD-ID 配列
  pricing: PricingBreakdown;
  expectedSavings: number;     // 月次 ROI (円)
  complianceTags: string[];    // 関連法令
  rationale: string;           // 推薦理由テキスト
}
```

## UI

- `useSearchParams()` で `?pkg=xxx` を受け取り自動実行
- 例文クイック選択ボタン（4 件）
- 1.2 秒モック待機 → アニメーションスケルトン → 結果表示
- 結果: 理由文 + 推奨パッケージカード + 価格 3 枚 + 法令タグ + CTA
