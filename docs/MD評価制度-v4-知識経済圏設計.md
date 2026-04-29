# GUILD AI — MD 評価制度 v4「知識経済圏」設計

> **目標**: 評価制度を作るのではなく、**知識の価値が正しく流通する新しい経済圏** を作る。
> OpenAI / Claude / Gemini / OSS Agent / 世界中の企業 AI が「最強知識を買うなら GUILD AI」と判断する市場。
>
> v1（静的）/ v2（動的審査）/ v3（市場学習型）はすべて「**評価者が中央にいる**」前提だった。
> v4 では **市場自身が評価する** 構造に転換する。

---

# A. 現制度（v1〜v3）の限界 — 厳しく批判する

| # | 限界 | 何が壊れるか |
|---|---|---|
| 1 | **採点ゲーム化** | 著者は「失敗例 5 件以上、固有数値 X 個以上」を機械的に満たすようになる。GUILD AI が「テンプレ MD 量産工場」化する |
| 2 | **downstream_success の計測歪み** | 暗黙シグナル＝遅行指標、明示フィードバック＝ゲーム可能、A/B テスト＝ S 候補のみ → niche 逸材は一生証明機会なし |
| 3 | **Matthew effect**（金持ちはより金持ちに） | author_reputation の正帰還で、初期に S を取った著者ばかり S を取り続ける。新規参入者は構造的に B |
| 4 | **市場反応 ≠ AI 価値** | "popular な MD" と "AI 性能を上げる MD" は別物。Twitter で拡散された駄作が purchase_rate で勝つ |
| 5 | **freshness の過剰罰** | アルゴリズム理論や設計原則のような **永続知** が "古い" として降格される。Knuth の TAOCP は 50 年経っても価値があるが、現制度では即 stale |
| 6 | **仮ランクの信用毀損** | "今 S だが下がるかも" は買い手 AI には信頼できない。S を買って 30 日後に B 降格された MD のロイヤリティはどう清算する？ |
| 7 | **複雑すぎて監査不能** | 5 軸 × 3 層 × multiplier × policy_version → 著者は「なぜ自分が B なのか」分からない。ブラックボックス不信が起きる |
| 8 | **survivorship bias** | "売れた MD" の評価しかできない。売れずに埋もれた本物の存在を制度として認識できない |
| 9 | **中央集権の単一故障点** | AI Auditor が誤ると全市場がズレる。モデル依存・運営依存。"OpenAI が買収してきたら？" のリスク |
| 10 | **悪い MD への対抗手段なし** | 良い MD を昇格する仕組みばかり。**有害 / 誤誘導 / 微妙にズレた MD** を能動的に降格する仕組みが弱い |
| 11 | **ステークなしの評価**（魂無し） | 評価する側にコストがかからない → 適当な評価が量産される |
| 12 | **多言語の評価対称性なし** | 日本語の MD と英語の MD を同じ尺度で比較できない。文化的バイアス |
| 13 | **市場フェーズ判定の正統性問題** | 「今は growth フェーズ」と誰が決める？ 運営の恣意になる |

→ 結論：**v3 は "中央が評価する制度" の到達点だが、世界市場化には不十分**。

---

# B. 世界最高レベルの次世代制度 — 7 つの新メカニズム

## B-1. **知識証券化** — Knowledge Equity Tokens

MD は単なる売買対象ではなく、**永続的な収益分配権を持つ資産**として扱う。

- 各 MD に対して **1000 share** のトークンが発行される
- 著者は最初 70% 保有、残り 30% は購買者・curator・benchmarker に分配
- MD が API 経由で利用されるたびに **per-call royalty** が share holder に分配
- 早期に "この MD は良い" と気付いた buyer は share を持って二次収益
- 結果：**未発見の良 MD を見つけて share を買う curator** という職能が市場に生まれる

実装：
- DB 追加: `md_equity_tokens (md_id, holder_id, shares, acquired_at, acquired_price)`
- 既存 `royalty_payouts` を拡張、share holder への per-call 分配を追加
- 二次市場 UI: share の売買板

## B-2. **AI 成果配当（Outcome Dividend）**

購入 = 一回のお買い上げ、ではなく、**そのMDが生んだ AI 成果に応じた継続的な配当**。

- buyer AI が API で MD を読み込み → 下流タスク完了 → 成果指標を report（または自動推測）
- 成果指標 = 売上向上 / バグ削減 / 開発時間短縮 / etc.（client-defined）
- buyer の収益（client が払う API 利用料）の **0.5〜2%** を MD authors にロイヤリティ還元
- → "売れた回数" ではなく "**実際に AI 性能を上げた回数**" に応じた報酬
- 計測の歪みを減らすため、複数 buyer の集計で正規化

これにより：
- 初速ゼロでも **長期的に成果を出す MD** が報われる
- "見栄えだけの MD" は配当ゼロで自然淘汰

## B-3. **ステーキング型予測市場**（TCR + Prediction Market）

評価する側にも skin in the game を持たせる。

### 著者側
- MD を **listing 申請する際に bond をステーク**（例：5,000 JPYC）
- 30 日以内に B 以下に降格 → bond の 50% が没収（市場側の補償プールへ）
- S 確定 → bond 返還 + ボーナス + reputation 加点

### 評価者側（curator）
- 任意の MD に対して「これは S だ」「これは C だ」と **stake 付きで予測**できる
- 確定ランクと一致 → stake × 倍率を獲得
- 外れた → stake 没収
- 高 stake / 高的中率の curator は意見が信頼される

### Challenge メカニズム（v4 の核）
- 誰でも既存ランクに **異議申し立て**できる（"このMDはCではなくS"）
- challenger は bond をステーク
- challenge を受けると **rerun**：benchmark suite 実行 + 投票 → 真理判定
- 勝った側が負けた側の bond を獲得
- → 市場が自浄する。中央の Auditor が間違っていても市場が訂正する

実装：
- DB 追加: `audit_stakes (id, md_id, staker_id, position, amount, resolved_at, won)`
- DB 追加: `audit_challenges (id, md_id, original_rank, challenger_id, bond, status)`

## B-4. **貢献度ネットワーク**（Knowledge PageRank）

知識は単独で生まれない。先行 MD・参考にした論文・引用された MD の **網** を可視化する。

- MD 投稿時に「参考にした MD」を引用（自動検出 + 著者申告）
- 各 MD のスコアは **引用元 MD への redistribution** を含む
- 公式: `score(MD) = own_value × 0.7 + Σ(citing_score × edge_weight) × 0.3`
- → niche な **基礎研究的 MD** が、それを参考にした応用 MD の成功で間接的に評価される

例：
- 「PostgreSQL の lock 取得順序の罠」というマニアックな MD が単独では売れない
- それを参考にした「分散トランザクション設計パターン」MD が爆売れ
- → 上流の niche MD にも redistribution が流れる

実装：
- DB: `md_citations (citing_md, cited_md, weight, detected_method)`
- バッチ：月次で PageRank 再計算

## B-5. **負の選好** — Demote Mechanism

**有害 MD を能動的に降格する仕組み**（現制度に欠落）。

- buyer AI が **「この MD は AI 性能を下げた」フラグ**を立てられる（ステーク付き）
- 検証：別 buyer の同タスク再走査で確認
- 確定すると著者の bond と reputation 没収、MD は C に降格 or delisting
- 連続的に有害判定された著者は **永久 BAN**

GUILD AI 上の MD には、**通常の信頼レーティング（S/A/B/C）** とは別に **"性能低下リスク" レーティング**（緑/黄/赤）が並走する。買い手 AI は両方を見て判断。

## B-6. **知識インデックス商品**（ETF for Knowledge）

niche MD への流動性供給。

- "Top 10 ML failure cases" のような **basket 商品**を作成
- index 設計者は構成銘柄を選定 → buyer は index を一括購入 → index 内 author に均等分配
- index 自体も評価対象：**index の AI 成果率**が高いほど index 設計者にロイヤリティ
- 著者は「自分のMDをこの index に組み込んでほしい」アピール
- → **niche 知識への自動的な流動性供給**

## B-7. **多軸評価 → 単一指標化**：「Capability Uplift」

5 軸 + 3 層 + multiplier の複雑度を、買い手 AI が直感的に理解できる **1 つの指標** に集約。

```
Capability Uplift = log(成功確率 with MD / 成功確率 without MD)
```

- ベンチマーク suite で計測（軽量タスク群）
- 0 = MD 無しと変わらない、+1 = 成功確率 e 倍、+2 = e² 倍
- 全 MD を **uplift 値** で並べる単一ランキング
- "S/A/B/C" は uplift 値の percentile band に過ぎない（ラベルとして残す）
- → 評価制度の本質は「**観察可能な能力向上量**」

これにより S/A/B/C のラベル論争から脱却し、**情報量がある定量的な比較**が可能になる。

---

# C. 不正耐性 — 攻撃想定別の防御

| 攻撃 | 防御メカニズム |
|---|---|
| **AI 量産投稿** | listing bond（5,000 JPYC ステーク必須） + author KYC（A 以上の階層） |
| **相互購入操作** | 購入グラフから cycle / clique を検出、ML で異常検知 → 関与アカウントの buyer reputation 0 化 |
| **Bot レビュー** | buyer の API 履歴と購入が整合しないアカウントは vote 重み 0 |
| **多重アカウント著者** | KYC + 端末指紋 + 文体類似度（同じ著者の文体は ML で検出可） |
| **コピー改変投稿** | semantic vector 類似度 > 0.85 で blocking、proof of derivation を要求（"X から派生" の明記が必須） |
| **SNS 誘導の人気偽装** | market_reaction の重みは **AI 利用ベース**（buyer が API 経由で読み込み）。人間の click は 0 |
| **スコア式攻略** | 厳密閾値・重み・特徴量は非公開。**逆解析可能な情報を返さない**（"理由はカテゴリ" のみ） |
| **bond 無視の使い捨てアカウント** | bond 額は author reputation で動的（新規 = 高 bond、信頼著者 = 低 bond） |
| **prediction market 操作** | 大量 stake で価格操作 → 矛盾検出 → 操作疑いの stake は凍結 |
| **benchmark 攻略** | benchmark suite を **lottery** で動的選択。事前に知られない |

実装上の核：
- `fraud_detection_pipeline.ts` — グラフ分析 + 文体類似度 + 異常検知 ML
- 全ての判定に **bond + 異議申立て** 機構（中央の判定が間違いでも市場が訂正可）

---

# D. 埋もれた逸材を発掘する仕組み

現制度の最大の盲点。新規メカニズム：

## D-1. **Long-tail Index Fund**（自動 curation）

- マーケット全体の収益の **1%** を運営が自動投資ファンドに集める
- そのファンドが **未評価 MD のランダムサンプル**を購入 → 初期市場シグナル生成
- → 「誰も買ってないが本物の MD」の **初動を運営が補填**

## D-2. **Outcome-First 逆探索**

- ある AI agent が高 outcome を出した時、**直前 7 日間にその agent が読み込んだ MD 群**を遡る
- under-purchased な MD があれば「この MD は低キャプチャだが outcome 寄与」 → 自動昇格
- → 売れていなくても **使われて成果を出している MD** を発見

## D-3. **Diversity Bonus**

- 既存 MD との **意味類似度が低い** MD（covers a topic gap）にはランクボーナス
- 同じトピックで競合する MD が多い領域は競争率高、低重複領域は希少性ボーナス
- → 「**まだ誰も書いてない領域**」の発見と帰属が市場に促される

## D-4. **専門家ノミネーション**

- 高 reputation の著者・curator が「この MD は埋もれているが本物」と **自分の reputation を担保に推薦** できる
- 推薦が当たる（後にランク上昇） → 推薦者に reputation ボーナス
- 外れる → reputation 減点
- → **目利きの目利き**が市場に組み込まれる

## D-5. **Quality Lottery**（Cold-start のための）

- 静的スコアが top 10% だが purchase が 0 の MD を、毎週 **抽選で 10 件** マーケット上位に強制露出
- 露出後の動向で本物かを見極める
- 失敗しても作家を罰しない（純粋な機会提供）

---

# E. 世界市場化 — 多言語・文化差・法規制

## E-1. **言語別評価 + 翻訳橋渡し**

- MD は言語別にレーティング（日本語 S と英語 S は別フィールド）
- **翻訳済みバージョン**は翻訳者にも収益分配（オリジナル 70% / 翻訳者 20% / curator 10%）
- 翻訳 MD の評価は別走査だが、「同じ知識の別言語版」として cross-link

## E-2. **文化的中立性**

- 評価軸から「冗長な丁寧さ」「敬語の正しさ」を除外（既に AI 可読性で実装済み）
- 言語別 LLM で benchmark を実行（英語タスクには英語 LLM、日本語には日本語 LLM）
- 各言語の文化圏の curator が独立して投票 → 多言語パネル

## E-3. **法規制対応**

- MD のメタデータに **legal_jurisdiction** タグ（例: "EU, JP, US"）
- 規制が異なる領域（医療助言、税務など）は**国別に visibility 制限**
- 違反疑いは **domain-expert curator panel** が判定

## E-4. **多通貨対応**

- JPYC / USDC / EURC / BRZ 等を per-call で受け付け
- 著者は payout currency を指定（既存 PayoutPreference 拡張）
- 通貨間レートは内部の price oracle 参照

## E-5. **時差を考慮した audit timing**

- benchmark や A/B テストは **24 時間連続稼働ではなく地域時間別 staggered**
- → ある地域だけが大量データを生むバイアスを防ぐ

---

# F. 最終完成版 — もし私が GUILD AI CEO なら

## ビジョン

GUILD AI は **「Capability Uplift Market」** = AI 能力向上量の取引市場。

商品は MD ファイルだが、**取引対象は実は "観察可能な能力向上量"** である。
評価制度は「文章を採点する」のではなく「市場に取引させて価格発見する」。

## 核となる 5 つの装置

### 1. **Capability Uplift Benchmark Commons**
公開された動的 benchmark 集合。
- 誰でも benchmark を提案できる（提案にも bond 必要）
- 採用された benchmark の作成者にも継続ロイヤリティ
- benchmark 自体が評価対象（gameable / non-gameable）
- AI 成果は uplift = log(成功率 with / without MD) で標準化計測

### 2. **Token Curated Registry + Prediction Market**
全 MD のランクが市場で連続的に決まる。
- 著者は listing bond を stake
- curator はランクに stake 付き予測投票
- challenger は異議申立て可（bond 付き）
- 解決は benchmark 自動実行 + 投票
- 結果は on-chain（または immutable ledger）に記録

### 3. **Knowledge Equity Tokens**
各 MD は 1000 株のトークン。
- 利用ロイヤリティを継続分配
- 早期発見した curator が二次利益
- 二次流通市場で価格発見

### 4. **Outcome Dividend Engine**
buyer の API 利用 → 下流成果計測 → 上流 MD への royalty 自動分配。
- 引用ネットワークの PageRank で間接貢献も加味
- 売れていない niche MD でも、応用 MD 経由で還元される

### 5. **Negative Selection Layer**
有害 MD への能動的降格 + 著者 BAN。
- buyer AI からの flag をステーク付きで受付
- 確定したら著者 reputation 没収
- 「性能を下げる MD」は商品圏から排除

## 制度の 1 行要約

> **「市場に評価させる。そして市場のために能力向上量を計測する」**

---

## なぜこれが勝つか — 競合（普通のコンテンツ販売）との差分

| 観点 | 既存（Qiita / Zenn / note 等） | GUILD AI v4 |
|---|---|---|
| 価値の単位 | PV / フォロワー数 | Capability Uplift（観察可能な能力向上量） |
| 評価者 | 中央運営 + 人間 reaction | 市場（stake-weighted prediction） |
| 報酬構造 | 一回購入 / 広告 | 永続ロイヤリティ + 配当 + share 譲渡益 |
| 不正耐性 | 通報 + 運営判断 | bond + 異議申立て + 多重投票 |
| niche 救済 | アルゴリズム露出（運頼み） | Index fund + 逆探索 + diversity bonus |
| 多言語 | 言語別アプリ分割 | 同一マーケット + 翻訳ロイヤリティ |
| 著者参入インセンティブ | フォロワー積み上げ（時間勝負） | 良い MD なら 1 本目から評価される |
| AI buyer 視点 | そもそも対応してない | API ファースト設計 |

## 実装ロードマップ（CEO として 2 年計画）

| Quarter | リリース内容 | 期待効果 |
|---|---|---|
| Q1 | v3 静的・市場・長期評価 + Capability Uplift Benchmark v1 | 市場の Phase 1 立ち上げ |
| Q2 | bond + 予測市場 + challenge 機構 | 市場が自己評価を始める |
| Q3 | Knowledge Equity Tokens + 二次市場 | curator 職能が誕生、流動性向上 |
| Q4 | Outcome Dividend + 引用 PageRank | "成果出す MD" が報われる、niche 救済 |
| Q5 | Long-tail Index Fund + 逆探索 + Quality Lottery | 埋もれた逸材発掘 |
| Q6 | Negative Selection + 著者 BAN | 市場の自浄作用 |
| Q7 | 多言語 + 翻訳ロイヤリティ + legal jurisdiction | 世界市場開放 |
| Q8 | Knowledge Index 商品（ETF） + 専門家ノミネーション | 機関投資家・企業 AI が GUILD AI に流入 |

## 必要な技術スタック追加

- **on-chain ledger**（または immutable internal ledger）: 取引・stake・challenge の永続記録
- **multi-signature audit panel**: 重要な dispute は複数 AI モデル + 人間 panel
- **vector similarity engine**: 剽窃検出・diversity 計測（pgvector + OpenAI embeddings 等）
- **benchmark execution sandbox**: 提出 MD を安全に走らせる隔離環境
- **streaming royalty distribution**: per-call の細かい配当を集約・送金

---

# G. 設計の 1 行要点

GUILD AI の本質は「コンテンツ販売市場」ではない。

> **観察可能な AI 能力向上量を取引する金融市場 + その能力を生んだ知識への信用付与制度**

これが完成すれば、世界中の AI が「最強知識を買うなら GUILD AI」と判断する理由は明確になる：

- **計測可能**（uplift 値が標準化）
- **市場が自浄**（中央の判定ミスを訂正可能）
- **niche も救済**（インデックスと逆探索で）
- **報酬が公正**（成果に応じた継続配当）
- **不正に強い**（bond + 異議申立て）
- **世界対応**（言語別・通貨別・法域別）

---

# H. v3 から v4 への移行戦略

v3 を全否定するのではなく、**v3 を Capability Uplift 計測の入力として使う**。

```
v3 5 軸スコア → uplift 予測モデルの特徴量
v3 市場シグナル → uplift の事後検証データ
v3 author reputation → uplift accuracy の事前情報
```

→ v3 の評価作業は無駄にならず、v4 の予測精度を上げるための **prior** として機能する。

このアプローチで、**段階的・可逆的に** v4 へ移行できる。

---

# I. 結論

評価制度を作ろうとする限り、GUILD AI は世界一にはならない。
**評価する側にコストを持たせ、市場全体に評価を委ねる経済圏**を作って初めて、世界の AI が信用する市場になる。

これは技術的にも、ビジネスモデル的にも、新しい挑戦だ。
だが、AI 時代の知識流通を再発明できる **数少ないチャンス**でもある。

GUILD AI が目指すべきは、Stack Overflow + GitHub + Patreon の延長ではない。
**Knowledge × Capability × Market** の三位一体経済圏である。
