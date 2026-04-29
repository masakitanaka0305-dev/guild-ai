# Profile Page 設計書

## 基本方針：収益優先のプロフィール

GUILD AI のプロフィールは「自己紹介ページ」ではなく**プロとしての実績を証明するページ**。
収益グラフ → 鑑定バッジ → 自己紹介の順で、稼ぎ実績を前面に出す。

---

## ルート構成

| パス | 用途 |
|------|------|
| `/profile` | 自分のプロフィール（固定ハンドル `demo-user`） |
| `/profile/[handle]` | 他者プロフィール（静的生成：alice/bob/carol/dave/eve） |

遷移元：`/guild`（運用）ページの「マイプロフィール」リンク（ヒーロー内）。  
ボトムタブは 4 枠を維持し、タブには追加しない。

---

## 1. 収益サマリ（ヒーロー）

```
[本日 ¥X,XXX +X%]  [今週 ¥XX,XXX +X%]  [累計 ¥X,XXX,XXX]  [Lock報酬 ¥XX,XXX]
──────────────── 30日エリアチャート（SVG自前） ───────────────────────────────
```

- 3ブロック+Lock報酬：`flex overflow-x-auto` on 375px / `grid grid-cols-4` on sm+。各ブロック `min-w-[140px]`
- 増減バッジ：前日比（dailyPct）/ 前週比（weeklyPct）、正=緑・負=赤
- Lock報酬カード：暗背景 `#1A1714` + ゴールド文字（Genesis 遡及解禁分）
- エリアチャート：`<AreaChart>` コンポーネント（SVG 自前、30点折れ線＋塗り）

### データソース
`src/lib/api-usage/index.ts`

| 関数 | 返り値 |
|------|--------|
| `getDailyUsage(handle)` | `{ jpy, calls }` |
| `getWeeklyUsage(handle)` | `{ jpy, calls }` |
| `getLifetimeUsage(handle)` | `{ jpy, calls }` |
| `getDeltas(handle)` | `{ dailyPct, weeklyPct }` (-20〜+40%) |
| `getLockUnlockedRewards(handle)` | `{ jpy }` (¥5,000〜¥50,000) |
| `getUsageHistory(handle)` | `number[]` (30日分の日次 JPY) |

すべて djb2 ベースの決定論的モック。

---

## 2. プロ識別バッジ列

```
[RankShield 64px]  [完了案件 N]  [月間コール N]  [鑑定済 N件]
Complexity Score ━━━━━━━━━━━━━━━ [score/100]  [ラベル]
```

### RankShield コンポーネント（`src/components/RankShield.tsx`）

| ランク | 縁色 | 文字色 |
|--------|------|--------|
| S | `#D4AF37` ゴールド | ゴールド |
| A | `#E64545` 赤 | 赤 |
| B | `#9890A8` グレー | グレー |

- 背景：常に `#1A1714`（黒）
- サイズ：48px（通常）/ 64px（プロフィールヒーロー）
- SVG `<circle>` + `<text>`、`role="img"` + `<title>`

### ComplexityMeter（`src/components/ComplexityMeter.tsx`）

- `role="meter" aria-valuemin=0 aria-valuemax=100 aria-valuenow={score}`
- スコア帯別バー色：≥80 = ゴールド / ≥60 = 緑 / <60 = グレー
- 「？」ツールチップ：`aria-describedby` で結びつけ（hover で表示）
- ラベル：エキスパート（80+）/ アドバンスト（60+）/ スタンダード（〜59）

### データソース
`src/lib/complexity-score/index.ts`

```typescript
computeComplexityScore(handle: string): number  // 0–100
getComplexityBreakdown(handle: string): ComplexityBreakdown
// { score, jobsCompleted, avgCcafDensity, label }
```

算出：`40 + (djb2(handle+"_complexity") % 51)`

---

## 3. 自己紹介（最小限）

- **顔写真なし**。代わりに**モノグラム円**（イニシャル 2 文字、hsl カラー決定論）。
- 名前 `@handle`、1行ステータス（役職）
- 自己紹介文：最大 120 文字、1 段落、ページ**最下部**に配置
- バナー・カバー画像なし

### モノグラム円デザインルール

```
hue = (handle.charCodeAt(0) * 37 + handle.charCodeAt(1) * 13) % 360
backgroundColor = hsl(hue, 55%, 38%)
文字色 = #FFFFFF
サイズ = w-16 h-16 (64px)
```

---

## 4. AreaChart（`src/components/AreaChart.tsx`）

- 外部依存ゼロ（d3 不使用）
- SVG `viewBox="0 0 400 H"` + `preserveAspectRatio="none"` でレスポンシブ
- 塗りエリア：`rgba(14,159,79,0.15)`（緑薄め）
- 折れ線：`#0E9F4F` 1.5px
- `role="img"` + `<title>` + `aria-label`

---

## アクセシビリティ

| 要素 | 実装 |
|------|------|
| ページ H1 | `<h1 className="sr-only">プロフィール</h1>` |
| 各セクション | `<h2>` 見出し |
| Complexity メーター | `role="meter"` + `aria-valuemin/max/now` |
| RankShield | `role="img"` + `<title>` |
| モノグラム円 | `aria-hidden="true"` |
| 増減バッジ | テキスト内に方向を含む |
