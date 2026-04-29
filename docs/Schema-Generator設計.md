# Schema-Generator 設計（Intelligence Productization #1）

## 概要

MD 投稿時に AI がノートの入出力仕様（JSON Schema）を自動生成し、
企業がノーコードで即座に API 連携できる状態にする仕組み。

現在はキーワード辞書ベースのモック実装。将来的には LLM が MD 本文を解析して生成する。

## キーワード辞書ルール

| キーワード（MD 本文 + タイトル） | 入力スキーマへの追加 | 出力スキーマへの追加 |
|--------------------------------|-------------------|--------------------|
| `pdf` / `ファイル` | `file: { type: string, contentEncoding: base64, contentMediaType: application/pdf }` | — |
| `url` / `リンク` / `ウェブ` | `url: { type: string, format: uri }` | — |
| `json` / `解析` / `構造化` | — | `fields: { type: array }`, `data: { type: object }` |
| `翻訳` / `translate` | `text: string`, `targetLang: { format: iso-639-1 }` | `text: string` |
| `請求書` / `invoice` | `file: (PDF)` | `vendor`, `totalAmount`, `date` |
| `サマリ` / `要約` / `summary` | `text: string` | `summary: string`, `keyPoints: array` |
| （該当なし） | `query: string` | `result: string` |

すべてのスキーマに `meta: { id, ts, version }` を共通付与する。

## 出力例（請求書の場合）

```json
// input
{
  "type": "object",
  "properties": {
    "file":  { "type": "string", "contentEncoding": "base64", "contentMediaType": "application/pdf" },
    "meta":  { "type": "object" }
  },
  "required": ["file"]
}

// output
{
  "type": "object",
  "properties": {
    "vendor":      { "type": "string" },
    "totalAmount": { "type": "string" },
    "date":        { "type": "string", "format": "date" },
    "meta":        { "type": "object" }
  },
  "required": ["vendor", "totalAmount", "date"]
}
```

## サンプル生成

`djb2(title + rank)` シードから2件のサンプルを決定論的に生成。
同一入力なら常に同じ `examples[0]`, `examples[1]` が返る（テスト可能）。

## OpenAPI 連携

`toOpenApiSpec(guildId, title, schemas)` で OpenAPI 3.1 YAML 相当の JSON を生成。
`SchemaPanel` の「OpenAPI 形式で書き出す」ボタンでダウンロード（クライアントサイド Blob）。

## UI 配置

- `/sell` 完了カード（CompletionCard）: フルサイズパネル
- `/asset/[id]` 右ペイン（specContent）: コンパクト版（`compact={true}`）

## ファイル

- `src/lib/schema-generator/index.ts` — コアロジック
- `src/components/SchemaPanel.tsx` — タブ付き表示コンポーネント（client）
- `src/lib/__tests__/productization.test.ts` — テスト（schema-generator 4件）
