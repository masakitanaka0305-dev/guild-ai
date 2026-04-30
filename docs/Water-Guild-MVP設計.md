# Water Guild — Hexagonal Robustness（MVP 設計）

> 沈黙の意匠で、データの堅牢性を語る。
> 動かないことが、信頼を語る。

---

## 1. デザイン原則

| 原則 | 意味 | 実装での担保 |
|------|------|--------------|
| **Hexagonal Robustness** | 6辺で組み合った甲羅。崩れない構造体としての登記台帳。 | 正六角形を rank badge / アイコン枠 / 装飾に静的に使う。 |
| **沈黙の保護** | 騒がず、漏らさず、深く保管する。 | アニメーション全面禁止（`data-anim="off"`）。 |
| **幾何学だけで世界観を語る** | キャラクターも擬人化も使わない。色・角丸・六角形・波線のみ。 | 既存マスコット PNG は撤去。`<Hexagon>` と `<WaveLine>` のみ。 |

---

## 2. デザイントークン

### 2.1 カラーパレット

| 役割 | 値 | 使い所 |
|------|----|--------|
| Background | `#0B1121` | `body` 背景。深海ネイビー。 |
| Surface | `#162035` | カード／パネル。 |
| Surface-2 | `#1E293B` | 入力フィールド／二次面。 |
| Accent | `#22D3EE` | CTA／リンク／rank S 塗り。Tailwind `cyan-400` 相当。 |
| Accent Hover | `#06B6D4` | （hover は `data-anim="off"` 下では効かない／予備）|
| Text | `#E2E8F0` | 本文／見出し。 |
| Muted | `#94A3B8` | 補足／ラベル。 |
| Divider | `rgba(226,232,240,0.10)` | 分割線。 |

### 2.2 トークン参照

```css
:root, [data-theme="water"] {
  --water-bg:           #0B1121;
  --water-surface:      #162035;
  --water-surface-2:    #1E293B;
  --water-accent:       #22D3EE;
  --water-accent-hover: #06B6D4;
  --water-text:         #E2E8F0;
  --water-muted:        #94A3B8;
  --water-divider:      rgba(226,232,240,0.10);
}
```

Tailwind では `bg-water-bg` `text-water-text` `border-water-divider` `shadow-water-glow` などで参照する。

### 2.3 角の丸み

| 用途 | 値 | クラス |
|------|----|--------|
| 入力／カード | 14px | `rounded-lg` |
| CTA／一次ボタン | 18px | `rounded-xl` |
| Pill / 補助 | 22px | `rounded-2xl` |

CTA は **必ず `rounded-xl`**。Flat ＋ 静的 `shadow-water-glow`。

---

## 3. 静的シェイプ

### 3.1 `Hexagon`（`src/components/ui/Hexagon.tsx`）

正六角形の SVG。`viewBox="0 0 100 100"` の 6 頂点ポリゴン。

```tsx
<Hexagon size={64} fill="#22D3EE" stroke="#22D3EE" label="S" labelColor="#0B1121" ariaLabel="ランク S" />
```

| Prop | 既定 | 用途 |
|------|------|------|
| `size` | `64` | 一辺ではなく viewBox 内サイズ（px）。 |
| `fill` | `transparent` | 塗り。 |
| `stroke` | `#22D3EE` | 縁取り。 |
| `strokeWidth` | `2` | 縁取りの太さ。 |
| `label` | — | 中央テキスト（`S` / `A` / `B` / `—` / `G` 等）。 |
| `labelColor` | `#E2E8F0` | テキスト色。 |
| `ariaLabel` | — | 指定時 `role="img"` を付与。装飾用なら省略 → `aria-hidden`。 |

#### 利用箇所
- **rank badge**（`RankBadge.tsx`）: S/A/B/D を六角形で描画。
- **avatar frame**（onboarding 確認画面ヘッダ）: 姓の頭文字を中央に。
- **トップページ「初めての…」バナー**: 装飾。

### 3.2 `WaveLine`（`src/components/ui/WaveLine.tsx`）

細線一本の波。`stroke-opacity` 既定 `0.3` で読みづらいくらいに目立たない。

```tsx
<WaveLine ariaLabel="水の意匠 — 静的波線" />
```

`/guild`（資産台帳）見出し直下に置く。アニメーション無し。

---

## 4. アニメーション全廃ルール

### 4.1 仕組み

1. ルート `<html>` に `data-anim="off"`。
2. `globals.css` の `@layer base` 内：

   ```css
   [data-anim="off"] *,
   [data-anim="off"] *::before,
   [data-anim="off"] *::after {
     transition: none !important;
     animation: none !important;
   }
   ```
3. これにより Tailwind の `animate-pulse` `animate-bounce` も無効化される。

### 4.2 検証

`src/lib/__tests__/no-anim-global.test.ts` が以下を保証する：

- CSS の kill switch が `*`／`*::before`／`*::after` を網羅し `!important` 付きで書かれている。
- `<html data-anim="off">` であること。
- `framer-motion` の import が src 配下に**ゼロ**。
- `guild-ai-mascot` の参照が src 配下に**ゼロ**。

---

## 5. Smart Pre-fill（入力レス・オンボーディング）

`/onboarding` の form フェーズは **「入力」ではなく「確認」**。

### 5.1 データソース

`MOCK_OAUTH_PROFILE`（OAuth 実装後に実セッション payload に差し替え）：

```ts
{
  fullName: "田中 雅基",
  email:    "masaki.tanaka.0305@gmail.com",
  githubHandle: "masaki-tanaka",
  githubUrl: "https://github.com/masaki-tanaka/water-guild-demo",
}
```

### 5.2 名前の自動分割

`splitJapaneseName(fullName)` → `{ familyName, givenName }`。

- ASCII / 全角空白で分割。
- 区切り無しの和名は **先頭2文字を姓**、残りを名（最頻ヒューリスティック）。
- Latin 単一トークンは姓に置く（要レビュー）。

### 5.3 UI 規約

- 入力欄は `defaultValue` プリフィル（OAuth 値を尊重し、編集はオプトイン）。
- ヘッダーに hex avatar frame（姓の頭文字）。
- CTA：「**確認して進む — 登記（Sync）開始**」 / `rounded-xl` ＋ `shadow-water-glow`。
- フォーカスリングは `ring-1 ring-[var(--water-accent)]`。

---

## 6. コピー差し替え一覧

| 旧 | 新 | 場所 |
|----|----|------|
| 登録する | **登記（Sync）** | `/marketplace`, `/showcase` 一次 CTA |
| たからもの登録する | **たからもの登記（Sync）** | `/showcase` |
| GitHub リポジトリ URL | GitHub **コードベース** URL | `/onboarding` |
| エンドポイント | おしごと窓口 | `/onboarding` 結果ペイン |
| 登録 → | **登記（Sync）** → | 各 CTA |

`/onboarding` メイン CTA は「**確認して進む**」。
ダッシュボードの精製動作（資産化）には「**精製（Mint）**」を使う。

### 6.1 Jargon-Lint で禁止語

`src/lib/__tests__/jargon-lint.test.ts` に追加された Water Guild 固有の禁止語：

- リポジトリ → コードベース
- エンドポイント → おしごと窓口
- squirtle / shimaenaga → マスコット禁止
- kawaii → プロ向けトーンに統一

---

## 7. アクセシビリティ

- 六角形 rank badge は `role="img"` ＋ `aria-label="ランク {rank}"`。
- フォームは全項目に `<label htmlFor>`。
- ボタンは min-height 44px（`min-h-11`）。
- `WaveLine` は装飾としては `aria-hidden`、説明的に使う場合 `ariaLabel` を渡せる。

---

## 8. レスポンシブ

| ブレイクポイント | 確認内容 |
|------------------|----------|
| 375 (iPhone SE) | hex 36px / wave 24px / 二段 CTA 折り返し可 |
| 768 (iPad) | hex 56px / wave 24px / 一段 CTA |
| 1280 (Desktop) | サイドバー併用、本文 max-width 720px |

---

## 9. 関連ファイル

- `tailwind.config.ts` — `colors.water.*`, `boxShadow.water-glow`
- `src/app/globals.css` — `[data-theme="water"]` ＋ `[data-anim="off"]`
- `src/app/layout.tsx` — `data-theme="water" data-anim="off"`
- `src/components/ui/Hexagon.tsx` — 静的六角形
- `src/components/ui/WaveLine.tsx` — 静的波線
- `src/components/RankBadge.tsx` — 六角形 rank badge
- `src/lib/name-split/index.ts` — 和名分割
- `src/app/onboarding/page.tsx` — 確認画面
- `src/app/guild/page.tsx` — 資産台帳ヘッダ

---

## 10. テスト一覧（Water Guild）

| テスト | 件数 | 場所 |
|--------|------|------|
| water-tokens | 4 | `src/lib/__tests__/water-tokens.test.ts` |
| hexagon | 4 | `src/lib/__tests__/hexagon.test.ts` |
| hex-rank-badge | 4 | `src/lib/__tests__/hex-rank-badge.test.ts` |
| name-split | 6 | `src/lib/name-split/__tests__/name-split.test.ts` |
| onboarding-prefill | 5 | `src/lib/__tests__/onboarding-prefill.test.ts` |
| wave-line | 4 | `src/lib/__tests__/wave-line.test.ts` |
| no-anim-global | 4 | `src/lib/__tests__/no-anim-global.test.ts` |

合計 **31 件** の新規テスト。
