# Scout LP 設計 — 海外向けランディング（Strategic Moat #95）

## 概要

`/scout` は海外のトップエンジニアへ「GitHub のスターを収益に変える唯一の銀行」
として GUILD AI をマーケティングする **英語バイリンガル LP**。

---

## ページ構成

```
/scout
├── Hero: "Turn Your GitHub Stars Into Real Income."
├── How it works (3 steps): Submit → Verify → Earn
├── Calculator: star count → monthly $ estimate
├── Why Japan? (4 点): Fast Setup / Stable JPY / IP Protection / Tax
├── Featured Builders (3 mock profiles)
└── Bottom CTA: "Open My Account" + "Contact Enterprise"
```

---

## Hero コピー

```
メインコピー: Turn Your GitHub Stars Into Real Income.
サブ: The only bank that converts your code into a perpetual royalty stream —
     built in Japan, paying in JPY/USD.
CTA1: Open My Account (→ /sell, 赤丸)
CTA2: Contact Enterprise (→ /business, ボーダー)
```

---

## Calculator

`ScoutCalculator.tsx`（client component）：
- GitHub star 数 → rank 推定 → `simulateRevenue()` → USD 換算（1JPY = $0.0067）
- 表示：`expected monthly: $XXX–$YYY`

---

## Featured Builders（モック）

3 名は **合成ハンドル**のみ（実在者・組織・著作物の参照なし）：
- `@han.dev` — 🇰🇷 composite
- `@sasha.k` — 🇺🇦 composite
- `@noah.io` — 🇺🇸 composite

---

## jargon-lint 例外スコープ

`/scout` 配下は英語 LP であるため、英語マーケティング語彙を許可。
詳細は `docs/jargon-lint-scope.md` に記載（今後作成）。

現在の許可語（strategic-moat コメント）：
`Global Scout / Encapsulated Intelligence / rate limit / クローラー検知`

---

## Next.js metadata

```typescript
export const metadata: Metadata = {
  alternates: { languages: { en: "/scout", ja: "/" } },
};
```

`<html lang="en">` は page.tsx 内の `<main lang="en">` で対応
（layout の lang を変更しない — SEO 的に安全な方式）。

---

## アクセシビリティ

- Calculator セクション：`role="form"`
- Hero CTA：`Link`（Next.js）＋クリアな aria-label
- Featured Builders：`aria-label="Featured builders"`

---

## ナビリンク

SidebarNav フッターに「🌐 Global Scout」を控えめ追加（`text-[11px]`）。

---

## 関連ファイル

- `src/app/scout/page.tsx`
- `src/app/scout/ScoutCalculator.tsx`
- `src/components/SidebarNav.tsx`（フッターリンク追加）
- `src/lib/__tests__/strategic-moat.test.ts`（4 テスト）
