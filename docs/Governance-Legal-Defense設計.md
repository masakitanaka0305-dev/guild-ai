# Governance & Legal Defense 設計

## 概要

投稿時の権利譲渡同意（Consent UI）と不適切コンテンツ報告（Emergency Report）の実装。
法的コンプライアンスと運営安全性を担保する。

## 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/lib/consent-log/index.ts` | 同意ログ（append-only） |
| `src/lib/emergency-report/index.ts` | 不適切報告ストア |
| `src/app/sell/page.tsx` | 同意チェックボックス追加 |
| `src/components/ReportModal.tsx` | 報告モーダル（focus trap, Esc 閉じ） |
| `src/components/ReportButtonSection.tsx` | 報告ボタン（client component） |
| `src/app/legal/terms/page.tsx` | API 利用規約（モック） |
| `src/app/legal/transfer/page.tsx` | 権利譲渡規約（モック） |
| `src/app/admin/reports/page.tsx` | 運営レポート一覧（モック） |

## 同意フロー

```
/sell フォーム
  ↓ 「権利譲渡規約・API 利用規約に同意します」チェックボックス
  ↓ checked = true でないと submit ボタンが disabled
  ↓ handleSubmit 時に recordConsent(handle, version) を呼び出す（将来実装）
```

### consent-log API

```typescript
recordConsent(handle, version, ts?, ip?): ConsentRecord
getConsents(handle): ConsentRecord[]
hasConsented(handle, version): boolean
```

## 不適切報告フロー

```
/asset/[id] → 「不適切なコンテンツを報告」テキストボタン
  ↓ ReportButtonSection (client component)
  ↓ ReportModal 表示（focus trap, Esc で閉じる）
  ↓ 理由選択: Spam / Plagiarism / Illegal / Other
  ↓ sendReport(guildId, reporter, reason, description)
  ↓ 送信完了画面 → 「閉じる」
```

### emergency-report API

```typescript
sendReport(guildId, reporterHandle, reason, description): EmergencyReport
getReports(): EmergencyReport[]
getPendingCount(): number
```

## 管理画面

`/admin/reports` — 未処理・確認済・却下をバッジ付きで一覧表示（SSR）。
将来的に認証ガード + API 経由での status 更新が必要。

## アクセシビリティ

- チェックボックスは `<label>` でラップ
- モーダルは `role="dialog" aria-modal="true" aria-labelledby`
- Esc キーで閉じる、first focus on select
- 送信ボタンは `type="submit"` で Enter でも発火
