# Visual Hierarchy 設計（#133）

GUILD AI の UI 全体を **18 トークン × L0–L3 サーフェス チェーン**で
締め直すための単一参照ドキュメント。Brand Palette（#127）→ Cinematic
Mint（#128）→ Healthy Excitement（#130）の上に重なる **最終視覚層**。

> 複数フェーズで色を上書きしてきた結果、ページごとに使用色が散らばり、
> 同色が衝突したり Primary が複数同居したりしていた。
> #133 は **「Primary は 1 視野に 1 つ」**を絶対ルールにし、
> 全ページで surface chain と AA contrast を機械的に揃える。

---

## 1. 18 トークン

### サーフェス（5）
| Token | Dark (Abyss) | Light (Logic White) | 役割 |
|---|---|---|---|
| `--color-bg-base` | `#020617` | `#F8FAFC` | L0 — ページの床 |
| `--color-bg-surface` | `#0E1422` | `#FFFFFF` | L1 — カード／パネル |
| `--color-bg-elevated` | `#1A2238` | `#F1F5F9` | L2 — モーダル／ホバー |
| `--color-border-subtle` | `rgba(255,255,255,0.06)` | `rgba(15,23,42,0.06)` | L3-subtle |
| `--color-border-strong` | `rgba(255,255,255,0.12)` | `rgba(15,23,42,0.12)` | L3-strong |

### テキスト（5）
| Token | Dark | Light | 用途 |
|---|---|---|---|
| `--color-text-primary` | `#F8FAFC` | `#212121` | H1〜H3、本文 |
| `--color-text-soft` | `#E0E0E0` | `#424242` | サブ見出し |
| `--color-text-muted` | `#94A3B8` | `#475569` | caption / helper |
| `--color-text-on-primary` | `#FFFFFF` | `#FFFFFF` | ボタン文字（紫上） |
| `--color-link` | `#C4B5FD` | `#6D28D9` | リンク |

### アクション（4）— Primary は **1 視野に 1 つ**
| Token | 値 | 役割 |
|---|---|---|
| `--color-action-primary` | `#4C1D95` | 唯一の Primary。最重要 CTA／focus ring |
| `--color-action-primary-hover` | `#6D28D9` | hover |
| `--color-action-primary-soft` | `#1E0F47` (dark) / `#E0E7FF` (light) | 背景帯／chip |
| `--color-action-secondary` | `#F59E0B` | お礼の金額／S 太鼓判／特別通知 |

### ヘルパー / ステータス（4）
| Token | 値 | 役割 |
|---|---|---|
| `--color-cyan-helper` | `#0EA5E9` (light) / `#38BDF8` (dark) | 警告／補助のみ。CTA 禁止 |
| `--color-status-success` | `#059669` (light) / `#10B981` (dark) | 緑ピル — 「正常稼働」表示にだけ |
| `--color-status-warn` | `#D97706` (light) / `#FFF176` (dark) | 黄ピル — 警告 |
| `--color-status-negative` | `#DC2626` (light) / `#E64545` (dark) | 赤ピル — エラー |

合計 **5 + 5 + 4 + 4 = 18 トークン**。

---

## 2. Primary 1 / 視野ルール

ある 1 画面（folder of pixel）の中に同時に表示される
`bg-brand-primary`（塗り）は **最大 1 つ**。これより多いと:
- ユーザーは「最重要アクション」を判別できない
- 紫の塊がページを侵食して視覚 hierarchy が壊れる

例外：
- focus ring の `outline-2 outline-brand-primary`：常に最前面の 1 つ
- 進捗バーの `linear-gradient(brand-primary → brand-secondary)` は塗りカウント外
- chip の `bg-brand-primary-soft` は塗りカウント外（薄帯はサブ扱い）

代替手段：
- **Secondary**：Primary の代わりに枠ボーダーのみ（ghost 風） `border-brand-primary text-brand-primary bg-transparent`
- **Tertiary**：文字だけ Primary、背景は L1 透明 `text-brand-primary bg-[var(--color-bg-surface)]`

---

## 3. WCAG AA — 18 ペア計測

`BRAND_PALETTE_PAIRS`（`@/lib/contrast`）が **18 組合せ**を CI でゲート：

### Dark / Abyss
| ペア | fg | bg | 計測比 |
|---|---|---|---|
| L0 abyss × text-primary | `#F8FAFC` | `#020617` | 19.6 |
| L0 abyss × text-muted | `#94A3B8` | `#020617` | 8.2 |
| L0 abyss × text-link | `#C4B5FD` | `#020617` | 12.4 |
| L1 surface × text-primary | `#F8FAFC` | `#0E1422` | 18.5 |
| L2 elevated × text-primary | `#F8FAFC` | `#1A2238` | 14.3 |
| brand-primary × on-primary | `#FFFFFF` | `#4C1D95` | 9.7 |
| brand-secondary × L0 abyss | `#F59E0B` | `#020617` | 11.5 |
| ai-success × L1 (text) | `#10B981` | `#0E1422` | 5.6 |
| ai-negative × L1 (text) | `#E64545` | `#0E1422` | 5.0 |

### Light / Logic White
| ペア | fg | bg | 計測比 |
|---|---|---|---|
| L0 white × text-primary | `#212121` | `#F8FAFC` | 16.7 |
| L0 white × text-muted | `#475569` | `#F8FAFC` | 8.0 |
| L0 white × text-link | `#6D28D9` | `#F8FAFC` | 6.7 |
| L1 surface × text-primary | `#212121` | `#FFFFFF` | 17.7 |
| L2 elevated × text-primary | `#212121` | `#F1F5F9` | 16.4 |
| brand-primary × on-primary | `#FFFFFF` | `#4C1D95` | 9.7 |
| brand-secondary × L0 ink | `#0F172A` | `#F59E0B` | 11.5 |
| ai-success × dark ink | `#0F172A` | `#059669` | 5.5 |
| ai-negative × on-primary | `#FFFFFF` | `#DC2626` | 5.9 |

全 **AA 以上** をクリア。`color-cohesion.test.ts > Every brand palette pair clears AA` で gate。

---

## 4. 各画面の色割当て

### `/`（Intelligence Deck）
- L0：abyss / white
- Hero ボタン：唯一の Primary `bg-brand-primary text-white`
- STEP カード：L1 surface ＋ L3-subtle border
- 数字バッジ：白抜き fill on Primary

### `/projects`
- カード：L1 + L3-subtle
- CTA：`bg-brand-primary text-white`（行ごとに 1 つ）
- 想定お礼：`text-brand-secondary` ＋ `metric-prime`
- status pill：slate / emerald / amber チップ

### `/projects/[id]`
- SectionCard：L1 ＋ `border-l-4 border-l-brand-primary`（5 つ並んでも左帯 4px のみで控えめ）
- Apply CTA：唯一の Primary
- その他のリンクは Tertiary（文字だけ）

### `/guild`
- 知恵袋銀行 Hero：metric-hero（gold metric）＋ L1 frosted card
- NextMilestoneCard：L1 + L2 progress bar 背景 + 紫→金グラデ
- HoF ticker：L1 ＋ cyan-helper 色のテキストのみ、背景透過

### `/applications`
- 行カード：L1 ＋ L3-subtle
- status chip：`bg-emerald-500/15` / `bg-brand-primary-soft` / `bg-amber-500/15`（同サイズ）
- Agent Active：emerald pill 1 つだけ

### `/profile`
- Achievement grid：解放済 ＝ tier color border、ロック ＝ L1 monochrome
- Knowledge Map：背景 L0、ノードは category color、エッジ subtle
- タブ：active = `text-brand-primary` ＋ `border-b-2 border-brand-primary`

### `/mint`
- Cinematic Mint そのまま（既存四相）
- reveal カード：L1 ＋ ring `brand-primary` ＋ shadow-brand-glow

### `/admin/*`
- KPI カード：L1、サイズ統一
- data table：`even:bg-[var(--color-bg-surface)]/40` zebra
- rank chip：S = `bg-brand-secondary text-[#0F172A]`、A = `bg-brand-primary`、B = `bg-brand-primary-hover`

---

## 5. テスト

| Test | カバー |
|---|---|
| `color-cohesion.test.ts > zero #6366F1/#FBBF24` | 旧 #127 brand のハードコードゼロ |
| `color-cohesion.test.ts > zero cyan hex/util` | warn/helper 以外で cyan ゼロ |
| `color-cohesion.test.ts > L0/L1/L2 chain` | globals.css のサーフェス チェーン |
| `color-cohesion.test.ts > one-Primary token` | `--color-action-primary` が単一の正本 |
| `color-cohesion.test.ts > status-negative wiring` | `--color-status-negative` aliased |
| `color-cohesion.test.ts > z-index hierarchy` | AppShell の z-20 / z-40 維持 |
| `brand-palette.test.ts > 18 spec pairs` | BRAND_PALETTE_PAIRS が 18 件 |
| `brand-palette.test.ts > Every pair clears AA` | 18 ペア全て ≥ 4.5:1 |

---

## 6. 既知の積み残し

- `/admin/applications` 以外の admin 画面（reports / metrics / disputes）にも同様の chip token 化を適用する余地あり
- `/scout/ScoutCalculator.tsx` の `hover:bg-yellow-600` は scout 専用 brass UI として意図的に残置。次フェーズで再検討
- ライト基調のコントラスト比は AA を満たすが、subtle border が薄すぎる場合は `border-strong` を選ぶこと
