# Compliance Report 設計

## 概要

GUILD MD の品質・セキュリティ・法令準拠状況を一枚の HTML レポートにまとめた品質保証書。
`window.print()` で A4 PDF として印刷・保存できる。

## 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/lib/compliance-report/index.ts` | レポートデータ生成（決定論的） |
| `src/app/asset/[id]/report/page.tsx` | 印刷対応 HTML レポート |
| `src/components/PrintButton.tsx` | `window.print()` ボタン |
| `src/app/globals.css` | `@media print` A4 スタイル |

## レポート構成

```
┌──────────────────────────────────────┐
│ GUILD AI 品質保証書                   │
│ タイトル  /  合否バッジ  /  証明書番号 │
│ 発行日・ランク・オリジン署名・サンプル数│
├──────────────────────────────────────┤
│ バックテスト結果                       │
│ 精度 / P95レイテンシ / エラー率        │
│ 月次精度トレンド棒グラフ（12ヶ月）     │
├──────────────────────────────────────┤
│ セキュリティチェック（OWASP 準拠）     │
│ 6 項目: PASS / WARN / FAIL バッジ    │
├──────────────────────────────────────┤
│ 法令・規格準拠状況                     │
│ 5 規格: 適合 / 条件付き適合 / 対象外  │
├──────────────────────────────────────┤
│ フッター: 証明書番号 / モック免責表記  │
└──────────────────────────────────────┘
```

## データ生成

全項目は `djb2(guildId + salt)` による決定論的生成:
- バックテスト: `getBacktestStats(guildId)` 再利用
- オリジン署名: `signOrigin(guildId, payload).signature` 再利用
- セキュリティチェック: `seed >> i & 0xff < 230` → PASS, < 250 → WARN
- 法令準拠: `seed >> (i*4) & 0xf < 11` → 適合, < 14 → 条件付き

## 判定ロジック

```typescript
overallVerdict =
  hasFail  → "審査中"
  hasWarn  → "条件付き合格"
  else     → "合格"
```

## 印刷スタイル

`@media print` (globals.css):
- `@page { size: A4; margin: 20mm; }`
- `font-size: 12pt`
- ナビ・ヘッダー・印刷ボタン非表示（`.print:hidden`）
- `section { page-break-inside: avoid; }`

## アクセス動線

1. `/asset/[id]` ページ → 「品質保証書を見る →」ボタン
2. `/business/checkout` ページ（将来的なリンク設置想定）
