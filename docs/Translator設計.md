# Translator 設計 — AI エージェント向け翻訳（Global Export Hub #94）

## 概要

`src/lib/translator/` は GUILD ノートの日本語 Markdown を
**AI エージェントが読み取れる英語 + JSON Schema** に変換するモジュール。
翻訳は決定論的（同一入力 → 同一出力）で、バージョン管理される。

---

## TRANSLATION_DICT

30 ペアの日英辞書（最低保証）。

| 日本語 | English |
|--------|---------|
| 請求書 | invoice |
| 自動化 | automation |
| 分類 | classification |
| 処理 | processing |
| 分析 | analysis |
| エラー対応 | error handling |
| データ管理 | data management |
| 実行 | execution |
| レポート | report |
| 最適化 | optimization |
| ... | ... |（30 ペア） |

---

## CJK 変換

辞書適用後も残った CJK 文字列を `[Japanese: 〜]` でラップ:

```
/[\u3000-\u9FFF\uF900-\uFAFF\u30A0-\u30FF\u3040-\u309F\uFF00-\uFFEF]+/g
```

例: `「価格最適化」システム` → `[Japanese: 「]pricing optimization[Japanese: 」]システム`

---

## API

```typescript
translateForAgent(mdContent: string, meta: TranslateMeta): AgentTranslation

interface TranslateMeta {
  title: string;
  guildId?: string;
  rank?: string;   // 省略時 "B" として schema-generator に渡す
}

interface AgentTranslation {
  english: string;       // 翻訳済みテキスト全文
  schema: GeneratedSchemas;  // schema-generator 出力（input/output フィールド）
  summary60w: string;    // 60 語以内の英語サマリー
  version: "v1";         // バージョン固定
}
```

---

## summary60w 生成

1. `english` を空白で分割
2. 先頭 60 語を取り出す
3. 60 語を超える場合は `...` を付加しない（ truncate のみ）

---

## schema 生成

`generateSchemas(mdContent, { title, rank: meta.rank ?? "B" })` を呼び出す。
`schema.input` と `schema.output` が定義されていることを保証。

---

## 決定論性

`translateForAgent` は純粋関数。同一の `(mdContent, meta)` に対し
常に同一の `{ english, summary60w, schema, version }` を返す。
外部 API や乱数不使用。

---

## 利用箇所

- `src/app/api/note/[guildId]/route.ts` — GET レスポンスに `translation` フィールドとして付加
- `src/app/asset/[id]/page.tsx` — 「AI 向け翻訳プレビュー」カード

---

## 関連ファイル

- `src/lib/translator/index.ts` — 実装本体
- `src/lib/__tests__/export-hub.test.ts` — 3 テスト
