# Sovereign Ledger 設計

## 概要

引用・派生時の収益分配（引用配分）と案件進捗管理（Job Progress）の総称。
MD エコシステム内でのフェアな報酬循環を実現する。

## 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/lib/citation-payout/index.ts` | 引用配分 10% ロジック |
| `src/lib/job-progress/index.ts` | 案件ステータス管理 |

## 引用配分（Citation Payout）

### フロー

```
citing MD が API 利用された
  ↓
payOnCitation(citingId, citedAncestors, totalMilliJpy)
  ↓
ancestorShare = floor(total × 0.10)    // 最近接祖先に 10%
creatorShare  = total - ancestorShare  // 残り 90% → royalty-protocol フロー
```

### 既存 royalty-protocol との整合

| パターン | 分配先 |
|----------|--------|
| 直接 API 呼出し（祖先なし） | creator 100%（従来通り） |
| 派生 MD が利用（祖先あり） | creator 90% + 最近接祖先 10% |
| さらなる祖先 | recursive-payout が別途処理 |

### 精度

- ミリセント整数計算（`Math.floor`）
- `formatMilliJpy(milliJpy)` で表示用文字列変換

## 案件進捗（Job Progress）

### ステータス遷移

```
applied (33%) → engaged (66%) → completed (100%)
```

| ステータス | 日本語 | プログレスバー |
|------------|--------|--------------|
| applied | 応募中 | 33% |
| engaged | 参画中 | 66% |
| completed | 完了 | 100% |

### API

```typescript
applyToJob(jobId, handle): JobProgress
advanceStatus(jobId, handle): JobProgress | null
getProgress(jobId, handle): JobProgress | null
getJobsForHandle(handle): JobProgress[]
```
