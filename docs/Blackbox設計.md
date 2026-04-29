# Blackbox 設計 — 公開モード制御（Global Export Hub #94）

> **注意**：Strategic Moat #95 にて **Encapsulated（最高保護）** モードが上位互換として導入されました。
> Blackbox は中位保護として継続しますが、クローラーブロックが必要な場合は Encapsulated を推奨します。
> 詳細は `docs/Encapsulated-Intelligence設計.md` を参照してください。

## 概要

`src/lib/blackbox/` は GUILD ノートの **公開範囲を 3 段階で管理**するモジュール。
「オープン」「API 専用」「Blackbox（実行専用）」の 3 モードを切り替えられる。

---

## 公開モード

| Mode | ラベル | 本文表示 | 実行 | 説明 |
|------|--------|---------|------|------|
| `open` | フルオープン（学習可） | ✅ | ✅ | デフォルト |
| `api-only` | API 限定（要認証） | ❌ | ✅ | 本文を API キー持ちのみ |
| `blackbox` | Blackbox（実行専用） | ❌ | ✅ | ロジック秘匿・収益化 |

---

## API

```typescript
setVisibility(guildId, mode, options?): VisibilityRecord
enableBlackbox(guildId, options?): VisibilityRecord   // setVisibility(guildId, "blackbox") の shorthand
getVisibility(guildId): VisibilityMode               // 未設定時 "open"
filterGetResponse<T>(guildId, data: T): Record<string, unknown>
isBodyVisible(guildId): boolean                      // "open" のみ true
isExecutionAllowed(_guildId): boolean                // 常に true（モード無関係）
```

---

## filterGetResponse の除外フィールド

`mode === "blackbox"` のとき以下を除去:

```
mdBody, source, body, content
```

その他のフィールド（`guildId`, `title`, `rank`, 統計値等）はそのまま返す。

---

## isExecutionAllowed の設計意図

実行（POST）は**常に許可**。Blackbox は「学習データとしての公開を制限する」のが目的であり、
API として呼び出されることで収益を生む機能は妨げない。

---

## PublicModeSelector コンポーネント

```tsx
// src/components/PublicModeSelector.tsx
"use client"
// role="radiogroup" aria-label="公開モードの選択"
// useState<VisibilityMode>("open")
// VISIBILITY_MODES 配列（3 件）から radio ボタンを生成
// blackbox 選択時に 🛡 海外スクレイピング対策済み バッジを表示
```

---

## VISIBILITY_MODES 定数

```typescript
export const VISIBILITY_MODES: VisibilityModeInfo[] = [
  { mode: "open",     label: "フルオープン（学習可）",   description: "..." },
  { mode: "api-only", label: "API 限定（要認証）",       description: "..." },
  { mode: "blackbox", label: "Blackbox（実行専用）",     description: "...", badge: "🛡 海外スクレイピング対策済み" },
];
```

---

## dep-ledger との分離

Blackbox は **dep-ledger と独立したストア**。
可視性モードを変更しても権利の系譜（Merkle Chain）は変わらない。

---

## 関連ファイル

- `src/lib/blackbox/index.ts` — 実装本体
- `src/components/PublicModeSelector.tsx` — UI
- `src/app/asset/[id]/page.tsx` — PublicModeSelector 埋め込み
- `src/app/api/note/[guildId]/route.ts` — filterGetResponse 適用
- `src/lib/__tests__/export-hub.test.ts` — 4 テスト
