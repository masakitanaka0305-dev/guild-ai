# Cinematic Mint 設計（#128）

GUILD AI の Mint Reveal を **健全な没入演出**に振り切るための設計仕様。
Brand Palette（#127）の上に重なる **モーション層**として、ブランドカラーの
切替（Mercari Purple → Deep Purple `#4C1D95`、お礼ゴールド → Electric Gold
`#F59E0B`）と組で、4 phase の起承転結を作る。

> Internal name only: 「Cinematic Mint」「アビス・ブラック」「ディープパープル」
> 「エレクトリックゴールド」「クリスタル・フェイズ」「啓示」は内部呼称。
> UI には絶対に表示しない（jargon-lint で外部出現を抑止）。

---

## 1. 4 Phase（合計 4.6s）

| Phase | 役割 | 尺 | 主要要素 |
|---|---|---|---|
| Phase 1 — 加速 | 情報の洪水（読みとり中） | 1.4s | matrix 風キーワード 12 個が深紫 30%透明度 でフェードイン→アウト。中央にゴールドのアウトラインで「読みとり中」 |
| Phase 2 — 飽和 | 価値の結晶化 | 1.4s | 中央 132px の **クリスタル SVG**（六角形 3 重 ＋ 渦巻きストローク #F59E0B）／周囲 8 個の パープル粒子が `particle-orbit` で 1 周／中央コピー「価値を結晶化中」 |
| Phase 3 — 静謐の間 | curtain — 啓示の前の "静かな闇" | 0.8s | 画面全体が `#020617` (アビス) に **静かにフェード**。中央にゴールドの極細線 1 本のみ。`role="status" aria-live="polite"` で「準備中…」を 1 度だけ通知。**エラー風／クラッシュ風／赤い表示は一切無し** |
| Phase 4 — 啓示 | 結果の浮上 | 1.0s | 黒からゴールドの radial-glow で中央に **HexRankBadge 80px ＋ ランク連動光**。`metric-hero` で **資産価値：¥XXX,XXX** を tabular-nums で表示。サブに「あなたの知恵が、銀行に届きました」。続いて 2 つのアクション「マイ銀行で確認 / もう一度出品する」 |

合計尺 = 1400 + 1400 + 800 + 1000 = **4600 ms** ≤ 5 s。テストで上限ロック。

### なぜ Phase 3 を「curtain」にしたのか
仕様の元ネタは「あえてクラッシュに見せる暗転」だが、これは **dark pattern** であり
ユーザーに不利益を与え得る。代替として「**静謐の間**」を採用：
- 暗転 ＝ 演出意図（curtain メタファ）であり、エラーや障害ではない
- `role="status"` ＋ 「準備中…」の polite 通知で screen reader が混乱しない
- 赤系・ローダー・error icon・「フリーズ」「クラッシュ」コピーは **使わない**
- 仕上がりの "情報の洪水→結晶化→静謐→啓示" の **4 段リズム**は損なわれない

---

## 2. アクセシビリティ

| トリガ | 挙動 |
|---|---|
| `prefers-reduced-motion: reduce` | Phase 1〜3 を全スキップし、500ms 後に Phase 4 のみ表示。`hero-rise` も `motion-safe:` プレフィックスで未適用 |
| `data-anim="off"` | グローバル kill-switch で全 keyframe が `animation: none !important` |
| Screen reader | `<section role="status" aria-live="polite">`。Phase 3 の「準備中…」のみ `<span class="sr-only">` で読み上げ |
| キーボード | 完了後の 2 ボタンは `min-h-[44px]` ＋ `focus:outline focus:outline-2 focus:outline-brand-primary` |

---

## 3. ヒエラルキー

```
<section data-testid="cinematic-mint" role="status">
  ├── Phase 1  matrix-drift ×12 token
  ├── Phase 2  crystal SVG + particle-orbit ×8
  ├── Phase 3  curtain-fade + sr-only 「準備中…」
  └── Phase 4  gold-glow → hero-rise
                ├── HexRankBadge size=80 showSubLabel
                ├── 資産価値 ¥... (metric-hero, gold)
                ├── 「あなたの知恵が、銀行に届きました」
                └── [マイ銀行で確認 →] [もう一度出品する]
```

---

## 4. CSS keyframes（tailwind.config.ts）

| keyframe | 持続時間 | 役割 |
|---|---|---|
| `matrix-drift` | 600–900ms | Phase 1 のキーワードフェード |
| `crystal-spin` | 8s linear infinite | Phase 2 の六角形回転 |
| `particle-orbit` | 1400ms | Phase 2 の粒子 1 周 |
| `curtain-fade` | 800ms | Phase 3 の暗転（実態はゆるい opacity 1 への遷移） |
| `gold-glow` | 1000ms | Phase 4 の radial-glow scale 0.6→1.2 |
| `hero-rise` | 700ms | Phase 4 の reveal カードリフトアップ |

すべて `motion-safe:` プレフィックスで `prefers-reduced-motion` 時はスキップ。

---

## 5. ブランド連動

- 主色 `#4C1D95` ／ハイライト `#F59E0B` ／背景 `#020617` の組み合わせは **Brand-Palette設計.md** の最終値そのまま
- Phase 4 reveal カードは `shadow-brand-glow` ＋ S 限定で `shadow-brand-glow-gold` を重ねがけ
- HexRankBadge の fill は `RANK_COLOR_TOKEN.S = "#F59E0B"` に統一。お礼の金額と S 太鼓判が同じ黄色になる

---

## 6. 既知の積み残し

- 本実装は `/onboarding/grading/[handle]/[repo]` に固定 demo ランクで挿入。本番ではランクと resp の `valuationJpy` を grading service から受け取る前提。
- Phase 1 の token list (`MATRIX_TOKENS`) は decorative 固定。本番では grading 結果に応じて動的に差し替えできる
- Audio: tick 音は **デフォ無音**。CoinCounter `soundEnabled` prop が opt-in 経路（ヘッダのミュートトグル）から渡される設計
