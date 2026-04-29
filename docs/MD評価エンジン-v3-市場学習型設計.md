# GUILD AI — MD 評価エンジン v3「市場学習型」設計

> **旧思想**: 投稿された文章の質を採点する
> **新思想**: 投稿後に**市場で価値を生んだか**を評価する
>
> v2「動的審査制度」（market_phase 別パラメータ）と併用する。
> v2 が「全体の蛇口の調整」、v3 は「個別 MD の生涯評価」。

---

## 1. 3 層評価モデル

```
┌──── Layer 1: 静的評価（T=0、投稿時） ──────────────────────────┐
│  情報密度・オリジナリティ・失敗例被覆・検証可能性・parse 容易性  │
│  → 仮ランク (provisional rank) を決定                            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──── Layer 2: 市場評価（T+1d 〜 T+30d） ───────────────────────┐
│  購入率・再購入率・保存率・API 継続利用率・返金率（負）           │
│  → 仮ランク → 確定ランク （promote / demote / sub-rank 付与）     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──── Layer 3: 長期評価（T+30d, T+90d, T+180d） ────────────────┐
│  AI 成果率・freshness・更新継続性・技術陳腐化                      │
│  → 永続価値 (S-Core) / 旬切れ降格 / 著者評判への反映              │
└──────────────────────────────────────────────────────────────────┘
```

各 Layer のシグナルは独立に蓄積され、**時間関数で重みが変化**する複合スコアにまとめる。

---

## 2. 仮ランクと再計算スケジュール

### タイムライン

| 時点 | 計算するもの | 利用可能データ | 結果 |
|---|---|---|---|
| T=0 | 静的評価のみ | static_score | **仮ランク（provisional）** S-tentative / A / B / C |
| T+7d | 静的 + 一次市場 | + purchase_rate / refund_rate | 第 1 確定ランク |
| T+30d | 全層、ただし downstream_success の信頼度低 | + repurchase_rate / save_rate / api_continuation | 第 2 確定ランク + sub-rank 候補 |
| T+90d | フルスコア | + freshness 検証, downstream A/B 結果（S 候補のみ） | 第 3 確定ランク + sub-rank 確定 |
| T+180d | 永続価値判定 | + still_used_30d 連続 6 回 | **S-Core 認定** or 自動降格 |

### 再評価トリガー（イベント駆動）

時間ベースに加えて、以下のイベントで即時再計算：
- 新規購入が **N 件溜まった**（N = 10）
- 返金イベント（即時 demote 候補に flag）
- 著者が MD を **更新**（更新時刻 reset、freshness ボーナス）
- ユーザーからの **通報 / フラグ**
- 言及している技術 / API が **deprecated になった**（freshness 急降下）

---

## 3. 時間対応スコア式

ユーザー提示式を「時間と共にデータが揃う」モデルに洗練：

```
confidence(T) = データ蓄積度（0..1）
  T=0    → 0.0   (静的のみ)
  T=7d   → 0.4
  T=30d  → 0.7
  T=90d  → 0.95
  T=180d → 1.0

raw_score(T) = (1 - confidence(T)) × static_score
             + confidence(T) × (
                 0.45 × downstream_success      ← AI 成果率（最重要）
               + 0.25 × market_reaction         ← 購入・再購入・保存
               + 0.15 × static_quality          ← 静的の残存
               + 0.15 × longevity_score         ← freshness × 30d 残存
             )

final_score(T) = raw_score(T)
               × freshness_multiplier(0.5..1.0)   ← 旬切れは即座にペナルティ
               × author_reputation_multiplier(0.7..1.0)
```

### なぜ multiplier 化したか
- **freshness は加点ではなく gating**：旬切れ MD は他がいくら高くても価値が落ちる
- **author reputation も gating**：粗製乱造著者の MD は内容だけでは S を出さない

### multiplier の式

```
freshness_multiplier   = 0.5 + 0.5 × clamp(freshness_score, 0, 1)
author_rep_multiplier  = 0.7 + 0.3 × clamp(author_score, 0, 1)
```

完全 fresh + 完璧著者でも 1.0 倍（純粋 raw_score 通り）。最低でも 0.35 倍（0.5 × 0.7）の penalty。

---

## 4. Layer 別シグナル詳細

### Layer 1: 静的評価
v2「動的設計」の 5 軸をそのまま継承。再掲のみ：

| 軸 | weight (default) |
|---|---|
| 情報密度 | 1.0 |
| オリジナリティ | 1.3 |
| 失敗例被覆 | 1.5 |
| 検証可能性 | 1.5 |
| AI parse 容易性 | 1.0 |

### Layer 2: 市場評価（短期）

| シグナル | 計測 | 期間 | 健全レンジ |
|---|---|---|---|
| `purchase_rate` | 露出 → 購入転換率 | 投稿後 7d | 業界 median 比 |
| `repurchase_rate` | 同一買い手の再購入 | 30d | ≥ 15% で良 |
| `save_rate` | bookmark / pin 率 | 7d | ≥ 20% で良 |
| `api_continuation_rate` | API 経由の継続利用 | 30d | 7d 以内に再呼び出し |
| `refund_rate` | 返金率 | 30d | < 5% で健全 |
| `referral_rate` | 引用された数 / 購入数 | 90d | ≥ 10% で S 候補 |

### Layer 3: 長期評価

| シグナル | 計測 | 周期 |
|---|---|---|
| `still_used_30d` | 直近 30d で 1 回以上使われた | 月次 |
| `freshness_score` | 言及技術の鮮度 | 言及キーワード DB と照合（後述） |
| `update_recency` | 著者による最終更新 | 即時 |
| `tech_obsolescence_flag` | 廃止 API / 古い手法を含む | 月次バッチ |

---

## 5. AI 成果率（downstream_success）の計測

**最も難しいが最重要の指標**。複数手法を組み合わせる：

### A. 暗黙シグナル（常時）
- 買い手 AI が MD を **API 経由で繰り返し参照**したか
- 同 buyer が 7d 以内に **同分野の別 MD を購入しなかった**（満足度の proxy）
- 買い手の **API key が継続利用**されている

### B. 明示フィードバック（オプトイン）
- 購入後 7d 以内に「この MD は役に立った？」 yes/no を return
- 重み付けは **buyer reputation** で調整（信頼できる buyer の声を厚く）

### C. A/B テスト（S 候補のみ）
- 同タスクを「MD あり / なし」で AI 実行 → 成功率の差分を計測
- コストが高いので S 候補（top 5%）にのみ実施
- 軽量モデル（一次フィルタ）→ 高性能モデル（境界判定）の二層

### D. 逆連鎖帰属
- 買い手 AI の出力がさらに別の AI に「買われた」場合、上流 MD にも貢献度を帰属
- ロイヤリティの仕組み（既存 royalty_payouts）と同形

### スコア算出

```
downstream_success = 0.30 × implicit_usage_score    ← 暗黙
                   + 0.25 × explicit_feedback_score ← buyer rep 加重
                   + 0.30 × ab_test_lift            ← S 候補のみ、他は欠損補完
                   + 0.15 × upstream_attribution    ← 逆連鎖
```

A/B test が無い MD（B 帯）は `ab_test_lift` を欠損 → 残り 3 項目を再正規化。

---

## 6. freshness（鮮度）

### 検出方法

**言及キーワード × 鮮度 DB**:

```ts
type FreshnessKeyword = {
  pattern: RegExp;       // 例: /Next\.js \d+/
  domain: "web" | "ml" | "infra" | "general";
  decayPerYear: number;  // 0..1, 高いほど早く陳腐化
  deprecated?: boolean;  // 既に廃止されているか
};
```

ドメイン別 default decay：
| ドメイン | decayPerYear | 例 |
|---|---|---|
| web framework | 0.45 | Next.js, React のメジャー手法 |
| ml api | 0.40 | OpenAI / Anthropic のモデル名 |
| infra | 0.20 | AWS / GCP の旧サービス名 |
| algorithms / patterns | 0.05 | アルゴリズム理論、設計原則 |
| general principles | 0.02 | プロジェクトマネジメント等 |

### freshness_score 計算

```
for each keyword detected in MD:
  age = (now - first_seen_in_techdb)
  decay = keyword.decayPerYear × age_in_years
  if keyword.deprecated:
    decay = 1.0  // 即時 0
  keyword_freshness = max(0, 1 - decay)

freshness_score = weighted_average(keyword_freshness, by_keyword_centrality)
```

`keyword_centrality` は MD 内でその語が**どれだけ中心的か**（出現回数 + タイトル/見出し含有）。
中心的キーワードが古いほど freshness 急降下。

### 自動降格

`freshness_score < 0.3` で **自動的に sub-rank "stale" を付与**、表示順位を下位に。
著者が更新すれば即時再評価。

---

## 7. 著者信用スコア（author_reputation）

```ts
author_score =  0.35 × historical_S_rate            // 過去 S を出した割合
              + 0.20 × (1 - avg_refund_rate)         // 返金率の逆数
              + 0.15 × update_continuity              // MD 更新の継続度
              + 0.15 × repeat_buyer_rate              // リピート購入率
              + 0.10 × peer_endorsement               // 他著者からの引用
              - 0.05 × report_rate                    // 通報率（penalty）
```

新規著者は `author_score = 0.5`（デフォルト中央値）から開始。
最初の 3 投稿は **author_score の影響を弱める**（cold start 対策）。

著者が S を量産すると author_score 上昇 → 次の投稿の仮ランクが甘めに。
逆に返金率が高いと author_score 低下 → 次の投稿は厳しく見られる。

---

## 8. S ランクの細分化（sub-rank）

S 認定された MD に **複数の sub-rank** を付与（バッジ重ね）。

| Sub-rank | 認定条件 | UI 表示 |
|---|---|---|
| **S-Core** | T+90d で freshness ≥ 0.8 AND still_used_30d 連続 3 回 | 永続価値（金バッジ） |
| **S-Hot** | 直近 7d の `purchase_velocity` が全 MD の top 1% | 今が旬（炎バッジ） |
| **S-Utility** | `downstream_success ≥ 0.95` AND サンプル ≥ 30 件 | AI 成果率最高（盾バッジ） |
| **S-Rare** | `originality ≥ 95` AND `repeat_rate ≥ 80%` AND `buyer_count < 30` | 独自情報特化（宝石バッジ） |

複数同時付与可。例：S-Core + S-Utility = 「永続価値があり、AI 成果率も最高」。

買い手 AI は MD 検索時に sub-rank で絞り込み可（"S-Utility だけ"）。

---

## 9. 失格・降格の自動化

### 即時降格
- 返金イベント発生 → 当該 MD の `refund_rate` 再計算 → 閾値超なら 1 ランク降格
- 通報 5 件以上で manualReviewQueue へ
- freshness_score が閾値割れ → "stale" sub-rank 付与（降格は猶予期間 14 日）

### 自動拒否
v2 設計の通り：認証情報露出 / 剽窃 / 架空実績 → 即拒否。

---

## 10. データ蓄積に必要な DB スキーマ追加

```sql
-- 評価結果の履歴（再評価のたびに追加）
CREATE TABLE audit_results_history (
  id text PRIMARY KEY,
  md_id text NOT NULL REFERENCES listings(id),
  audited_at timestamp NOT NULL DEFAULT now(),
  rank text NOT NULL,                    -- "S" | "A" | "B" | "C"
  sub_ranks text[],                       -- ["S-Core", "S-Hot"]
  layer_scores jsonb NOT NULL,            -- { static, market, longitudinal }
  policy_version text NOT NULL,
  trigger text NOT NULL                   -- "scheduled-7d" | "event-purchase" | "event-refund"
);

-- 市場メトリクス（期間スナップショット）
CREATE TABLE md_market_metrics (
  md_id text NOT NULL REFERENCES listings(id),
  period_start timestamp NOT NULL,
  period_end timestamp NOT NULL,
  purchases int NOT NULL DEFAULT 0,
  repurchases int NOT NULL DEFAULT 0,
  refunds int NOT NULL DEFAULT 0,
  saves int NOT NULL DEFAULT 0,
  api_calls int NOT NULL DEFAULT 0,
  downstream_success_score numeric(5,2),
  PRIMARY KEY (md_id, period_start)
);

-- 著者信用スコア（時系列）
CREATE TABLE author_reputation (
  user_id text PRIMARY KEY REFERENCES users(id),
  score numeric(5,2) NOT NULL DEFAULT 0.50,
  components jsonb NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now()
);

-- freshness シグナル
CREATE TABLE freshness_signals (
  id text PRIMARY KEY,
  md_id text NOT NULL REFERENCES listings(id),
  signal_type text NOT NULL,              -- "keyword" | "deprecated_api" | "version_outdated"
  keyword text,
  centrality numeric(5,2),
  detected_at timestamp NOT NULL DEFAULT now()
);

-- 鮮度キーワード DB（手動メンテ + 自動収集）
CREATE TABLE freshness_keywords (
  pattern text PRIMARY KEY,
  domain text NOT NULL,
  decay_per_year numeric(4,3) NOT NULL,
  deprecated boolean NOT NULL DEFAULT false,
  first_seen_at date NOT NULL,
  notes text
);
```

---

## 11. 実装ロードマップ

| Phase | 内容 | 依存 | 期待効果 |
|---|---|---|---|
| **Phase 1** | Layer 1 を v2 動的設計で実装、provisional rank を発行 | （単独） | 仮ランクが市場に出る |
| **Phase 2** | `audit_results_history` テーブル追加、再評価 cron（7d/30d/90d） | Phase 1 | 履歴ベース UI（"先月は A、今月 S" 表示） |
| **Phase 3** | Layer 2 シグナル収集計装（既存 checkout / api_keys / gateway_logs を集計） | Phase 2 | market_reaction が計算可能に |
| **Phase 4** | downstream_success の暗黙シグナル + 明示フィードバック API | Phase 3 + buyer feedback endpoint | AI 成果率の主軸が動き出す |
| **Phase 5** | freshness_keywords DB + 自動 lint | （独立） | 旬切れ自動降格 |
| **Phase 6** | author_reputation の月次集計 | Phase 2 + 3 | 著者乱造の抑止 |
| **Phase 7** | S sub-rank 認定ロジック + UI バッジ | Phase 1〜6 | S の細分化で買い手の選択精度向上 |
| **Phase 8** | downstream A/B test（S 候補のみ） | Phase 4 | S-Utility の信頼性確立 |

各 Phase は独立リリース可。Phase 1-3 だけでも市場学習の骨格が完成する。

---

## 12. 公開レスポンス（買い手・著者向け）

```json
{
  "md_id": "asset-001",
  "current_rank": "S",
  "sub_ranks": ["S-Core", "S-Utility"],
  "score_band": "high",
  "rank_history": [
    { "at": "2026-04-01", "rank": "A", "trigger": "initial-static" },
    { "at": "2026-04-08", "rank": "S", "trigger": "scheduled-7d", "reason": "high purchase_rate + low refund" },
    { "at": "2026-05-01", "rank": "S", "sub_ranks": ["S-Hot"], "trigger": "scheduled-30d" },
    { "at": "2026-07-01", "rank": "S", "sub_ranks": ["S-Core", "S-Utility"], "trigger": "scheduled-90d" }
  ],
  "next_evaluation_at": "2026-10-01",
  "freshness_band": "fresh",
  "improvement_hints": [],
  "policy_version": "v3-growth-2026-04"
}
```

---

## 13. 設計の肝（要点まとめ）

1. **3 層構造**: 静的・市場・長期 を独立に蓄積、時間で重みが移動
2. **仮ランク**: 投稿時はあくまで仮、市場で証明された MD だけが S に残る
3. **AI 成果率（downstream_success）が最重要軸**: 0.45 weight で他を圧倒
4. **freshness は multiplier**: 旬切れ MD は他軸高くても降格
5. **著者 reputation も multiplier**: 粗製乱造を著者単位で抑止
6. **S は sub-rank で細分化**: 同じ S でも「永続/今旬/AI 成果/独自」で差別化
7. **再評価はイベント駆動 + 時間駆動**: 返金や更新で即時再計算
8. **policy version 監査可能**: 「いつのどの政策で判定されたか」を後から検証可
9. **A/B test は S 候補のみ**: コスト効率と精度のバランス
10. **冷静な cold start**: 新規著者は信用 0.5 から、最初の 3 投稿は cold-start で甘め

---

## 14. v2「動的審査制度」との関係

| 項目 | v2 (動的審査) | v3 (市場学習型) |
|---|---|---|
| 対象 | **市場全体の蛇口** | **個別 MD の生涯評価** |
| 主役パラメータ | reviewStrictness, rateTargets | downstream_success, freshness, author_score |
| 時間軸 | 月次の policy 更新 | 投稿後 7d/30d/90d/180d の再評価 |
| 役割 | 全体の品質ライン調整 | 個別 MD の「実証された価値」追跡 |

両者は**併用**する：
- v2 が「現在の市場フェーズで S は 5% を許容」を決定
- v3 が「この MD は 90 日経って実際に S 相当か？」を判定
- 両 OK のときだけ S が確定

---

## 15. 結論

GUILD AI の評価制度は **「投稿時点の判決」ではなく「生涯の証明」**。

- 投稿時の S は仮ランク
- 市場で売れ、AI が成果を出し、時間に耐えた MD だけが S を維持できる
- 著者の連続的な信頼が次の投稿に反映される
- ハック耐性のため、厳密な計算式は非公開、カテゴリ理由のみ公開

これにより、GUILD AI は「採点された静的なマーケット」ではなく、**自己学習する信頼の循環経済圏**になる。
