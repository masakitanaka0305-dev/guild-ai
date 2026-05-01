# Mercari Lightness 設計（#126）

GUILD AI のコピー・トーン・モーション・色を **メルカリ的な軽快さ**へ寄せた表現層。
Friendly Tone（#123）／ Logic White（#125）／ Midnight Logic（#124）に重なる **トップ層**として、
語彙・テンポ・触覚（haptics）の足並みを揃える。

> **Internal name only**: 「Mercari Lightness」「Logic White」「Midnight Logic」は内部呼称。
> UI には絶対に表示しない（jargon-lint で外部出現を抑止）。

---

## 1. 言葉の方針

| 旧表現（避ける） | 新表現（Mercari Lightness） |
|---|---|
| マイページ — もちもの | あなたの知恵袋銀行 |
| 中身を見る / 応募する | この困りごとを助ける |
| 持っていません — X 以上 | まだ持っていません。似た知恵を出品してみよう |
| お墨付き / 高評価 / 標準 / 非公開 | 金の太鼓判 / 銀の太鼓判 / 銅の太鼓判 / みならい |
| 仕上げる（Mint 終端 CTA） | 金の太鼓判カードにする（rank別） |
| 思考密度: 80 | プロの技術が詰まっています |
| uptime 30 days | 安定して動き続けています |

**判定ロジック**：価値を「測る」言葉ではなく「**読み手に伝える**」言葉に置き換える。
- 数値 → 体験のラベル化（"プロの技術が詰まっています"）
- 判定 → 励まし（"似た知恵を出品してみよう"）
- ステータス → 現在進行形（"今、働いています"）

`prettifyAuditReason()`（`@/lib/proof-of-make`）が ai-auditor の機械語ラベルを画面用フレーズに翻訳する。

---

## 2. ランク・メダル

`RANK_COLOR_TOKEN`（`@/lib/grading`）が単一の正本。

| Rank | tier | fill | ink | stroke | サブラベル（友好） |
|---|---|---|---|---|---|
| S | 金 | `#D4A437` | `#FFFFFF` | `#CA8A04` | 市場価値トップ1% |
| A | 銀 | `#94A3B8` | `#0F172A` | `#94A3B8` | すぐ役立つ即戦力の知恵 |
| B | 銅 | `#B45309` | `#FFFFFF` | `#92400E` | これからもっと光る知恵 |
| D | みならい | `transparent` | `#0F172A` | `rgba(148,163,184,0.45)` | 育成枠の知恵 |

`RankBadge` と `HexRankBadge` は両方ともこのトークンから色を引く。`/mint` 最終 CTA は `rankCardCta(rank)` でランク別の文言「金 / 銀 / 銅 / みならい カードにする」を返す。

---

## 3. リアルタイム演出

### CoinCounter（`@/components/ui/CoinCounter`）
- `/guild` 「あなたの知恵袋銀行」直下に常駐
- 5–8 秒間隔で `+¥X` を `motion-safe:animate-fade-in` で表示
- `aria-live="polite"`、`aria-atomic="true"` で読み上げ
- `motion-reduce` 時はフェードを抑制し値の更新だけ

### EarningTicker（`@/components/ui/EarningTicker`）
- `<MainHeader>` と `<AppShell>`（desktop sidebar）の両方に常駐する小型チップ
- `useLiveEarnings(userId)` の `lastDelta` を購読
- 同じく `motion-safe:animate-fade-in` ＋ `motion-reduce:animate-none`
- `lastDelta === 0` の初期状態では何も描画しない

### 「今、働いています」
- `/guild` の各 weapon カードに付く emerald パルス
- `animate-pulse motion-reduce:animate-none`
- 「貸出中」より **能動的**な印象を与えるための友好表記

---

## 4. モーション規範（TAP_CLASS）

`@/lib/motion` が単一の primitive を export：

```ts
export const TAP_CLASS =
  "transition-transform duration-100 ease-out " +
  "active:scale-[0.98] motion-reduce:active:scale-100";
```

主要 CTA（`/mint` advance、`/projects` カード／行 CTA、`PlugInApply`、`/guild さらに稼ぐ`）は
全て `${TAP_CLASS}` を className に含める。Mint advance は `useTactile("coin")`、PlugInApply は `useTactile("quest")` で 10ms バイブを発火。

`prefers-reduced-motion: reduce` 時の挙動：
- `active:scale-[0.98]` → 100% に固定（`motion-reduce:active:scale-100`）
- `animate-fade-in` → 描画されない（`motion-safe:` プレフィックス）
- `useTactile` 内部でも `vibrate()` を即 return

---

## 5. オンボーディングの語り口

`DECK_STEPS`（`@/lib/intelligence-deck`）：

```ts
{ number: 1, title: "あなたのコツ（メモ）を見つける", subtitle: "GitHub と連携して、あなたが書いてきた『工夫』を AI が読みとります" },
{ number: 2, title: "そのコツの価値を鑑定する",      subtitle: "金・銀・銅の太鼓判で、市場での読み応えをチェックします" },
{ number: 3, title: "分身AIが企業で働き始める",      subtitle: "あなたの代わりに、知恵カードが企業のお困りごとを助けます" },
```

「登記」「鑑定」「派遣」（社会制度語）から「メモ」「鑑定」「分身AI」（個人の物語）に振り切る。

---

## 6. テスト・lint

| Test | カバー |
|---|---|
| `src/lib/__tests__/midnight-tuning.test.ts` | K1 — Midnight 4 値（#101418 / #1C2126 / #4DD0E1 / #FFF176 / #E0E0E0） |
| `src/lib/__tests__/friendly-vocab-sweep.test.ts` | K3 — onboarding deck の3行 rewrite |
| `src/lib/__tests__/projects-mercari-grid.test.ts` | K4 — mobile 2-col grid + relativeDeadline |
| `src/lib/__tests__/positive-recommend.test.ts` | K5 — 「似た知恵を出品してみよう」＋強調コピーキャプション |
| `src/lib/proof-of-make/__tests__/rank-cta.test.ts` | K6 — rankCardCta / condense / prettifyAuditReason |
| `src/lib/__tests__/guild-knowledge-bank.test.ts` | K7 — h1「あなたの知恵袋銀行」＋ CoinCounter ＋ 今、働いています |
| `src/lib/__tests__/earning-ticker.test.ts` | K8 — header chip ＋ aria-live ＋ motion-reduce |
| `src/lib/__tests__/tap-scale.test.ts` | K9 — TAP_CLASS が canonical class を持ち、major CTA が継承 |

`jargon-lint` の PERMITTED に Mercari Lightness 用語を追記（コメント行 #126）。FORBIDDEN は据え置き — 旧トーン（応募する／資産で応募する／企業隠蔽 など）はそのまま禁止のまま運用する。

---

## 7. 既知の積み残し

- `RankBadge` が D の `D` を `—` で表示しているのは Friendly Tone 由来。`みならい` のミニアバターが必要なら `/guild` 内で別途検討。
- `CoinCounter` の初期値は `useLiveEarnings(userId).jpy`（その時点の合計）。完全リセット表示にしたい場合は `initialJpy={0}` で渡せる。
- `EarningTicker` は `lastDelta === 0` のとき何も描画しない仕様。初回バンプまでは header に空きが出る。
