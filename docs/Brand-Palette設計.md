# Brand Palette 設計（#127 — Final Polish）

GUILD AI の UI を **3 色固定**に締め直すための単一参照ドキュメント。
Friendly Tone（#123）／ Logic White（#125）／ Midnight Logic（#124, #127 retune）／
Mercari Lightness（#126）の上に重なる **最終ブランドレイヤー**。

> Internal name only：「Mercari Purple」「お礼 Gold」「Cyan Helper」は内部呼称。
> UI には絶対に表示しない（jargon-lint で外部出現を抑止）。

---

## 1. 3 色固定

| 役割 | 名称（内部）| Hex | 主な用途 | 禁止 |
|---|---|---|---|---|
| Primary   | Mercari Purple | `#6366F1` | プライマリ CTA／進捗線／主要アイコン／focus ring | 警告／補助の文脈で使わない |
| Secondary | お礼 Gold      | `#FBBF24` | お礼の金額／S 太鼓判／特別通知 | 通常の CTA・アイコンで使わない |
| Helper    | Cyan Helper    | `#0EA5E9` (light) / `#38BDF8` (dark) | 警告／補助／進行中以外のステータス | **CTA に使わない** |

ホバー（Primary）は `#4F46E5`（Logic White 由来の Indigo-700）。
Midnight 側のホバーは `#818CF8`（Indigo-400）で持ち上げる。

---

## 2. CSS 変数（globals.css）

```css
:root {                                /* Logic White */
  --color-action-primary:        #6366F1;
  --color-action-primary-hover:  #4F46E5;
  --color-action-primary-soft:   #E0E7FF;
  --color-action-secondary:      #FBBF24;
  --color-action-secondary-soft: #FEF3C7;
  --color-cyan-helper:           #0EA5E9;

  --color-ai-action: var(--color-action-primary);  /* 既存トークンは alias */
  --color-link:      #4F46E5;
}

[data-theme="midnight"] {
  --color-action-primary:        #6366F1;
  --color-action-primary-hover:  #818CF8;
  --color-action-primary-soft:   rgba(99,102,241,0.18);
  --color-action-secondary:      #FBBF24;
  --color-action-secondary-soft: rgba(251,191,36,0.18);
  --color-cyan-helper:           #38BDF8;

  --color-link: #A5B4FC;            /* indigo-300 — シアン由来を撤去 */
}
```

旧トークン（`--color-ai-action` / `--primary` / `--water-accent`）は
**全て brand action token の alias** として残す。コンポーネントを書き換え
なくてもブランド色が自動で行き渡る。

---

## 3. Tailwind taxonomy（tailwind.config.ts）

```ts
colors: {
  brand: {
    primary:        "var(--color-action-primary)",
    "primary-hover": "var(--color-action-primary-hover)",
    "primary-soft": "var(--color-action-primary-soft)",
    secondary:      "var(--color-action-secondary)",
    "secondary-soft": "var(--color-action-secondary-soft)",
    "cyan-helper":  "var(--color-cyan-helper)",
  },
}
```

主要 CTA は `bg-brand-primary text-white hover:bg-brand-primary-hover` の
3-token セットを基本とする。**`bg-cyan-*` `text-cyan-*` は警告／helper 以外で禁止**
（`brand-palette.test.ts` の `cyan-restricted` テストで CI ガード）。

---

## 4. 太鼓判メダル（最終版）

| Rank | tier | fill | ink | サブラベル（友好） |
|---|---|---|---|---|
| S | 金 | `#FBBF24` | `#0F172A` | 市場価値トップ1% |
| A | 銀 | `#94A3B8` | `#0F172A` | すぐ役立つ即戦力の知恵 |
| B | 銅 | `#B45309` | `#FFFFFF` | これからもっと光る知恵 |
| D | みならい | `transparent` | `#0F172A` | 育成枠の知恵 |

S（金）は **brand-secondary と同じ #FBBF24** に統一。お礼の金額と S 太鼓判が
同一の黄色で表現されることで「お金 ＝ 金 ＝ ゴールド」のメンタルモデルが揃う。

---

## 5. WCAG AA 計測

`BRAND_PALETTE_PAIRS`（`@/lib/contrast`）の 6 組合せを CI で検証。

| ペア | fg | bg | 計測比 | 規準 |
|---|---|---|---|---|
| brand-primary × on-primary | `#FFFFFF` | `#6366F1` | 5.0:1 | AA ✓ |
| brand-secondary × bg-base (dark) | `#FBBF24` | `#0F172A` | 11.0:1 | AAA ✓ |
| bg-base × text-primary (light) | `#212121` | `#F8FAFC` | 16.7:1 | AAA ✓ |
| bg-base × text-primary (dark) | `#F1F5F9` | `#0F172A` | 15.7:1 | AAA ✓ |
| bg-base × text-muted (dark) | `#94A3B8` | `#0F172A` | 6.5:1 | AAA ✓ |
| bg-base × text-link (dark) | `#A5B4FC` | `#0F172A` | 9.0:1 | AAA ✓ |

`MIDNIGHT_PAIRS` は 7 ペア（brand-primary × on-primary、emerald／violet pill ×
dark-ink ほか）に再編。`LOGIC_WHITE_PAIRS` も同じ purple 値で再計測済み。

---

## 6. モーション：Purple Ripple

`useRipple()`（`@/lib/motion`）が主要 CTA に **brand-primary/20** の
ふんわりした円を発生させる。`220ms ease-out`、`0.95 → 1.05` にスケールしながら
フェードアウト。

- 適用先：Mint advance、PlugInApply、各種 Submit／FAB
- `motion-reduce` 時：チップは描画されるが即フェード（`motion-safe:animate-purple-ripple`）
- `data-anim="off"` 時：`onPointerDown` 内部で発火を抑止

---

## 7. 移行ルール

1. Cyan utility classes（`bg-cyan-*` 等）は `bg-brand-primary` 系へ。
2. ハード hex（`#22D3EE` `#06B6D4` `#4DD0E1`）は `#6366F1` へ置換。
3. ハード yellow（`#FDE047` `#D4A437`）は `#FBBF24` に統一（S = 金 = お礼）。
4. ダークテーマでのリンク色は `#A5B4FC`（旧 cyan を撤去）。
5. 旧 `metric-prime-white`（白の太字数字）は **`metric-hero`** に置き換え。
   `/guild` 合計売上のみが該当（モバイル 36px → 54px、PC 48px → 72px）。
6. 旧 `お貸出し中` ステータスは **「お仕事中」** に表記統一。
7. 旧見出し `もちもの時価のうごき` は **「あなたの知恵の価値」**。

---

## 8. 例外

- 警告 / 補助：`bg-amber-*` `text-amber-*` `bg-brand-cyan-helper` は引き続き
  使ってよい（**CTA でなければ**）。
- 既存テストが「過去の cyan 色を documentary に書いている」場合は、コメント
  にその旨を明記して残す。新規テストは brand-primary を期待する。
