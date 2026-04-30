# Main Journey 設計

## 概要

GUILD AI のメインユーザー導線（ログイン → 投稿 → 案件応募 → 収益確認）の設計仕様。
すべてのステップが 1 バグなく完結することが Final Build の完了条件。

## 5 ステップ導線

```
1. /login          ─→ 認証通過（モック: ユーザー名のみ）
2. /sell           ─→ MD 投稿（同意チェック ON → 鑑定 → お店にならべる）
3. /marketplace    ─→ S/A/B ランクで公開 → D は非公開
4. /jobs           ─→ 案件一覧 → 応募する（報酬額 CTA）
5. /guild          ─→ 総資産ヒーロー（40pt font-black）+ 収益確認
```

## 各ステップの完了条件

| ステップ | 完了条件 | 計測指標 |
|----------|----------|---------|
| 認証 | `/login` → `/` へリダイレクト | session exists |
| 投稿 | rank ≠ D、marketplace に掲載 | `audit().rank !== "D"` |
| 出品 | floorPrice > 0、タイトル非空 | `listing.floorPrice > 0` |
| 応募 | status = "applied"、progressPct = 33 | `getProgress().status === "applied"` |
| 収益 | hourlyRate > 0 | `hourlyRate > 0` |

## パフォーマンス目標

| エンドポイント | 目標 |
|---------------|------|
| `/api/note/[id]` | ≤ 200ms |
| `/api/contact` | ≤ 200ms |
| `/api/issues` | ≤ 200ms |
| `/api/atoa/[id]` | ≤ 200ms |

すべてサーバーレス関数（決定論モック）のため実測値は 1〜10ms 台を想定。

## E2E 風スモークテスト

`src/lib/__tests__/final-build.test.ts` の各 describe ブロックが担当：
- D ランク判定: Anti-Spam Engine
- GitHub Trust: 未検証フラグ
- 引用配分: Sovereign Ledger
- 案件進捗: Job Progress
- 同意ログ: Governance
- 緊急報告: Safety
- ゼロデイバナー: Zero-Day Display
