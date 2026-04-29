# Encapsulated Intelligence 設計 — 最高保護モード（Strategic Moat #95）

## 概要

`src/lib/encapsulated/` は既存 Blackbox (#94) の上位互換として、
**クローラー UA 即時ブロック + rate limit + 実行従量課金** を組み合わせた
最高保護層を提供する。

---

## 4 モードの違い

| Mode | 本文 GET | 実行 POST | クローラーブロック | Rate Limit |
|------|----------|-----------|-------------------|------------|
| open | ✅ | ✅ | ❌ | ❌ |
| api-only | ❌ | ✅ | ❌ | ❌ |
| blackbox | ❌ | ✅ | ❌ | ❌ |
| **encapsulated** | ❌ | ✅ | ✅ | ✅ |

---

## クローラー UA リスト（10 種）

```
GPTBot / ClaudeBot / Google-Extended / CCBot / Anthropic-AI /
Bytespider / PerplexityBot / Diffbot / Amazonbot / Applebot-Extended
```

判定：`isLikelyCrawler(ua)` — UA 文字列に上記を含むか substring 検索。

---

## Rate Limit

`checkRateLimit(guildId, clientKey)` — 1 分ウィンドウで `rpm` 超過時に `false`。
デフォルト `rpm = 10`。`enableEncapsulation` の `rateLimit.rpm` で上書き可。

---

## API

```typescript
enableEncapsulation(guildId, options?: { allowOpen, rateLimit: { rpm } }): EncapsulationRecord
getEffectiveMode(guildId): EncapsulatedMode
filterEncapsulatedResponse(guildId, data): Record<string, unknown>  // strips mdBody, source, body, content, internalNotes
isLikelyCrawler(ua: string): boolean
checkRateLimit(guildId, clientKey): boolean
```

---

## next.config.js との連動

`/api/note/*` に `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` を付与。
クローラー UA は `isLikelyCrawler` によりアプリケーション層でも 403 を返す。

---

## UI: PublicModeSelector（4 ラジオ）

| Mode | 色 |
|------|-----|
| open | kaki（ゴールド） |
| api-only | kaki |
| blackbox | kaki + blue バッジ |
| **encapsulated** | **red** + gold 縁バッジ「🛡 Encapsulated Intelligence」 |

---

## 関連ファイル

- `src/lib/encapsulated/index.ts`
- `src/lib/blackbox/index.ts`（上位互換、VisibilityMode に "encapsulated" 追加）
- `src/components/PublicModeSelector.tsx`（4 ラジオ）
- `src/app/api/note/[guildId]/route.ts`（isLikelyCrawler 適用）
- `src/lib/__tests__/strategic-moat.test.ts`（7 テスト）
