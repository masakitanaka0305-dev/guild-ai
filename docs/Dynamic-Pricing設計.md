# Dynamic-Pricing 設計 — 為替対応（Global Export Hub #94）

## 概要

`src/lib/dynamic-pricing/` は API 呼び出し元の IP アドレスまたは認証トークンから
**通貨と価格乗数を動的決定**するモジュール。
日本ユーザーは JPY (×1.0)、グローバルユーザーは USD (×1.2) で課金する。

---

## 判定ロジック

```
resolvePrice(input):
  1. input.authToken が "gld_JP" / "gld_ja" / "gld_jp" で始まる → JPY 1.0
  2. input.ip が日本 IP プレフィックスにマッチ → JPY 1.0
  3. input.ip が空 / localhost → JPY 1.0（デフォルト）
  4. それ以外 → USD 1.2
```

### 日本 IP プレフィックス

`"103.", "106.", "113.", "118.", "119.", "122.", "124.", "126.", "153.", "210.", "219.", "222."`

---

## 定数

```typescript
export const USD_PREMIUM = 1.2;
export const ALL_CURRENCIES: PricingCurrency[] = ["JPY", "USD", "EUR", "GBP"];
export const CURRENCY_SYMBOLS = { JPY: "¥", USD: "$", EUR: "€", GBP: "£" };
export const CURRENCY_FLAGS   = { JPY: "🇯🇵", USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧" };
```

---

## 戻り値

```typescript
interface PricingResult {
  currency: "JPY" | "USD";
  multiplier: number;          // 1.0 or 1.2
  floorPriceLocal: number;     // JPY: original, USD: Math.round(jpy / 100 * 1.2) / 10
  reasoning: string;           // 判定理由（ログ・レスポンス用）
  currencyHint: string;        // "JPY" | "USD"
}
```

---

## floorPriceLocal 計算

| 通貨 | 計算 |
|------|------|
| JPY | `floorPriceJpy`（変換なし） |
| USD | `Math.round(floorPriceJpy / 100 * USD_PREMIUM * 10) / 10`（1 桁で丸め） |

例: floorPriceJpy=1500 → USD = Math.round(1500/100 × 1.2 × 10)/10 = 18.0

---

## サンプルインプット（テスト用）

```typescript
export const SAMPLE_INPUTS = [
  { input: { ip: "122.20.1.1", authToken: "gld_abc", floorPriceJpy: 1000 } },
  { input: { ip: "54.240.1.1", authToken: "gld_us_abc", floorPriceJpy: 1500 } },
  { input: { ip: "", authToken: "gld_JP_secret" } },
  { input: { ip: "8.8.8.8", authToken: "gld_abc" } },
];
```

---

## 利用箇所

- `src/app/api/atoa/[id]/route.ts` — API レスポンスに `pricing` フィールドとして付加
- `src/app/asset/[id]/page.tsx` — 通貨チップ（JPY/USD は kaki 色、他はグレー）

---

## 関連ファイル

- `src/lib/dynamic-pricing/index.ts` — 実装本体
- `src/lib/__tests__/export-hub.test.ts` — 3 テスト
