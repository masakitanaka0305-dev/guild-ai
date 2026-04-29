# Global IP Registry 設計 — JP オリジン署名（Strategic Moat #95）

## 概要

`src/lib/origin-registry/` は全 GUILD MD に **「この知能のオリジンは日本である」**
というデジタル署名を付与し、国際的な権利主張の基盤を作るモジュール。

現在はモック実装（決定論ハッシュ）だが、将来 ISO 標準準拠の電子署名
（XAdES / JAdES）に置き換えられるよう **純粋関数**で実装されている。

---

## 署名方式（モック）

```
raw = "${guildId}|${JSON.stringify(payload)}|${signedAt}|${signerKeyId}"
signature = "jp-sig-" + djb2(raw + "salt-a") + djb2(raw + "salt-b")
```

- `signerKeyId`：`gld-jp-YYYY-MM`（年月ベースの擬似キー名）
- `originCountry`：常に `"JP"`

---

## 将来の標準準拠への移行計画

本実装は以下を前提に設計されている：

1. `signOrigin(guildId, payload)` は **純粋関数に近い設計**（内部 Map はリセット可）
2. 実運用では：
   - 署名秘密鍵を KMS / HSM に保管
   - `signature` を XAdES / JAdES 形式の Base64 DER に置き換え
   - `verifyOrigin` を PKI 検証（証明書チェーン確認）に変更
3. `signerKeyId` は実運用では X.509 証明書の Subject Key Identifier に対応

---

## API

```typescript
signOrigin(guildId, payload: OriginPayload): OriginSignature
verifyOrigin(guildId): { valid: boolean; record: OriginSignature | null }
getOrigin(guildId): OriginSignature | null
autoSignAll(guildIds: string[]): OriginSignature[]
originSummary(guildId): { country: "JP"; signature; signedAt } | null
```

---

## 利用箇所

- `src/app/api/note/[guildId]/route.ts` — GET レスポンスに `origin` フィールド付加
- `src/app/asset/[id]/page.tsx` — 「🇯🇵 Origin Verified — JP」バッジ表示

---

## 検証 API（将来）

将来 `GET /api/verify-origin?guildId=...` エンドポイントで公開し、
外部から署名の真正性を確認できる仕組みを想定。

---

## 関連ファイル

- `src/lib/origin-registry/index.ts`
- `src/lib/__tests__/strategic-moat.test.ts`（5 テスト）
