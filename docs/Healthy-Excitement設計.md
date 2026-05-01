# Healthy Excitement 設計（#130）

GUILD AI の "熱狂" を **5 つの健全な動機軸**で組み立て直したリリース。
Live モード（#129）を撤去し、その分のエネルギーを「達成・期待・所属・発見・上達」
の 5 軸に振り直しました。

> #128 までの没入演出は **見た目**を強化していました。
> #130 は **意味**を強化します — ユーザーの行動と進歩そのものに紐づく
> 仕掛けを置き、dark pattern を踏まずに長期エンゲージメントを作る。

---

## 0. 設計原則 — dark pattern を踏まないライン

| やる | やらない |
|---|---|
| 過去の事実だけを表示 | 「N% 急騰」「価格暴落」のような根拠のない値動き演出 |
| 達成可能なしきい値（3 / 7 / 14 / 30 など） | 達成不可能な時限式 streak（24 時間ログインなしでリセット など） |
| 1 タップで停止／非表示できる UI | 「閉じる」を隠す／3 秒後に勝手に閉じる |
| 名前を出す（${counterparty}） | 「○○人が見ています」の偽装 viewer count |
| 通知の頻度ガード（24h dedupe） | 同種通知の連打 |
| reduced-motion で全フォールバック | 必須の派手アニメ |

---

## 1. 5 軸の対応関係

| 軸 | 機能 | 場所 | データ源 |
|---|---|---|---|
| **達成** | アチーブメント・ウォール（30 バッジ） | `/profile/achievements` | `evaluateUnlocks(history)` |
| **期待** | 次のマイルストーン（4 種、進捗バー＋バッジプレビュー） | `/guild` 上部 | `getNextMilestone(history)` |
| **所属** | Hall of Fame ティッカー（自分＋匿名 peer） | MainHeader 直下 | `buildHoFTickerStack(userId)` |
| **発見** | Knowledge Map（force layout） | `/profile/map` | `demoKnowledgeGraph(handle)` |
| **上達** | Mint Reveal ランク連動演出（粒子・glow・希少度キャプション） | `/onboarding/grading/...` Phase 4 | `getRarity(rank)` |

---

## 2. 達成 — Achievement Wall

`@/lib/achievements` が **30 バッジ × 5 軸** を export。各バッジは
`PREDICATES` テーブルで `UserHistory` から決定論判定し、未解放タイルは
モノクロ＋「あと N 件で解放: ${criteria}」を提示。

代表 5 バッジ：
- `first-mint`（達成・bronze）：最初の Mint を 1 件
- `s-rank-streak`（達成・legend）：直近 3 件すべて S
- `royalty-streak-7`（期待・silver）：7 日連続お礼
- `cross-functional-trio`（発見・silver）：Dev / Design / PM すべて
- `calls-legend-100k`（上達・legend）：累計 100,000 コール

シェアは「@${handle} が **${badgeName}** バッジを獲得しました — 知恵を資産に
\n${criteria}」を生成し、X / Threads / クリップボードの 3 経路で送出。

---

## 3. 期待 — Next Milestone

`@/lib/milestones` が 4 種類のしきい値テーブルを持ち、最も進捗率の高い
1 件を `<NextMilestoneCard>` に表示。ティアがあるたびに次が現れる
"段階的な期待" を作る。

例：
- 累計 ¥24,800 → あと **¥75,200** で **累計 ¥100,000 達成**
- 連続 4 日 → あと **3 日** で **連続 7 日達成**
- 累計コール 4,220 → あと **5,780** で **累計 10,000 コール達成**
- 登記 12 件 → あと **18** で **登記 30 件達成（Knowledge Cartographer）**

進捗バーは紫→金のグラデーション（`linear-gradient(90deg,
var(--color-action-primary), var(--color-action-secondary))`）。

---

## 4. 所属 — Hall of Fame ティッカー

MainHeader 直下の細い帯（h-7、`#0E1422`）。30 秒に 1 行ずつ
ローテーションし、自分の事実と匿名化された peer 事実を
**3 件に 1 件**の比率で交互に表示。

- 例（自分）：「**@you** の知恵が直近 24 時間で **41 人**に使われました」
- 例（peer）：「**@h\*\*\*\*o** さんの『観測性設計』が金の太鼓判を獲得」
  （`anonymizeHandle()` が常に同じハンドルを同じマスクに変換）

`× ボタン`で 24 時間非表示（`localStorage["halloffame_dismissed_until"]`）。

---

## 5. 発見 — Knowledge Map

`@/lib/knowledge-map` の決定論グラフを `<KnowledgeMap>` が描画。

- 中央：自分（`fx`/`fy` で固定）— 白い大きなドット
- 周囲：知恵カード（紫 `#4C1D95`）／お困りごと（violet `#8B5CF6`）／AtoA 取引（金 `#F59E0B`）
- 線の太さ ＝ コール数を `linkStrokeWidth` で正規化（1〜6px）
- 距離 ＝ 直近性を `linkDistanceMultiplier` で 0.6〜1.6 倍にスケール
- ノードは `tabIndex={0}` ＋ `role="button"` で Tab で巡回、Enter / Space でフォーカス強調
- reduced-motion 時は force tick を skip し `staticLayout` の同心円配置で描画

---

## 6. 上達 — Mint Reveal ランク連動演出

`@/lib/rank-rarity` の `RANK_RARITY` テーブル（合計 100%）：

| Rank | 直近 100 件のシェア | 粒子 | キャプション |
|---|---|---|---|
| S | **8%** | 6 | 「この太鼓判は希少です（直近 100 件で 8%）」 |
| A | 22% | 2 | 「確かな実力です（直近 100 件で 22%）」 |
| B | 41% | 0 | 「着実な一歩です（直近 100 件で 41%）」 |
| D | 29% | 0 | 「次は太鼓判を狙いましょう」 |

CinematicMint Phase 4 が `data-rarity-percent` ／ `data-particle-count` を
出力し、`glowSize` も S=380 → A=320 → B=260 → D=200 と段階化。
S のときだけ Star 6 個を Phase 4 の周囲に静的にスプレッド配置。

---

## 7. アクセシビリティ

| 軸 | a11y フック |
|---|---|
| Achievements | 各タイル `role="img"` + 解放／未解放で `aria-label` 切替、シェアボタン `data-testid` |
| Milestones | 進捗バー `role="progressbar"` + `aria-valuenow/min/max` + 文言付き `aria-label` |
| Hall of Fame | `role="status"` + `aria-live="polite"` + 閉じるボタンに `aria-label="このティッカーを 24 時間閉じる"` |
| Knowledge Map | SVG `role="img"` + `aria-label`、各ノード `tabIndex={0}` + `role="button"` + Enter キー対応 |
| Mint Phase 4 | 既存 `role="status"` を維持、rarity caption は `data-testid` のみ（`role="status"` の文中で読み上げ） |

---

## 8. 撤回した機能（#129 → #130）

| 撤回 | 理由 | 代替 |
|---|---|---|
| `<LiveModeSwitch>` ＋ `useLiveMode` | 操作の複雑性を増やすわりに長期動機が薄かった | 5 軸の健全演出に振り替え |
| CoinCounter の `LIVE_TICK_MS` / `playPoyon` / `aria-live throttle` | 同上 | 単一 3-5s 仕様に統合 |
| `coinLiveMode` localStorage キー | 撤去（再発防止に jargon-lint で `Live モード` を NG 入り） | — |
