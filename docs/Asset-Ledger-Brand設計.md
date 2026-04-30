# Asset Ledger Brand 設計

> Phase A: 用語・ブランド統一 — シマエナガ/kawaii 系を Professional 用語に置換

## 背景

初期のゲーミフィケーション用語（シマエナガ・ぶき・おだちん・おたから・かわいい）は
エンタープライズ採用の障壁となっていた。B2B 向け語彙への統一が必要。

## 用語置換テーブル

| Before（廃止） | After（採用） | 備考 |
|---------------|--------------|------|
| シマエナガ銀行 | Asset Ledger | UI 禁止語。内部モジュール名 `shima-ledger` は維持 |
| ぶき | スキル / ノート | 18y/o トーン廃止 |
| おだちん | 報酬 | 同上 |
| おたから | 資産 | 同上 |
| かわいい | （削除） | プロ向けトーンに統一 |
| シマエナガ通帳 | 端数残高 | UI 上のみ置換 |

## jargon-lint 禁止語

追加した禁止語（`src/lib/__tests__/jargon-lint.test.ts`）：

- `シマエナガ` — Asset Ledger brand v1
- `かわいい` — プロ向けトーン統一
- `shadow-for-employer` — 反検知機能は非実装方針
- `stealth-employer` — 同上
- `企業隠蔽` — 同上
- `会社にバレない` — 同上

## SupportChat 除去

`AppShell.tsx` から `<SupportChat />` をコメントアウトではなく削除（import ごと）。
再導入する場合は v2 設計書（Shima Support v2.md）を参照。

## ガードレール

本プラットフォームは反検知機能を提供しない。
IP 帰属・NDA 遵守はユーザーの自己責任であり、ToS 第2条・第4条で明文化。
「会社にバレないようにする」機能の実装は永久に禁止する（jargon-lint で機械的に検査）。
