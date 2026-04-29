# GUILD AI — MD ファイル評価エンジン v2 設計（動的審査制度）

> 「完璧な採点理論ではなく、市場が荒れないこと」を最上位目標とする。
> 大学入試ではなく **クレジットカード審査 + App Store レビュー + GitHub reputation** のハイブリッド。

---

## 設計の二層構造

### Layer 1: 静的評価（市場フェーズに依らない）

5 評価軸の **観測可能なシグナル計測** + 失格シグナル lint。
これらは「事実」であり、フェーズ補正の対象外。

| 軸 | 検出シグナル |
|---|---|
| 情報密度 | 段落間 Jaccard / 接続詞比率 / 結論先出し構造 |
| オリジナリティ | 固有数値・制約の出現密度 / 一般論文比率 / 内部出典の有無 |
| 失敗例被覆 | "失敗/罠/エラー" 密度 / 症状→原因→対処 triple 数 |
| 検証可能性 | 出典 URL・コミット SHA・version / 再現手順 / 実測値 |
| AI parse 容易性 | 見出し階層整合 / 用語ゆらぎ率 / コピペ可能ブロック数 |

### Layer 2: 動的ポリシー（市場フェーズで変化）

「閾値・重み・cap・テスト発動率」を **runtime parameter** にする。

```ts
interface MarketPolicy {
  marketPhase: "bootstrap" | "growth" | "competitive" | "mature";
  reviewStrictness: number;          // 0..1 全閾値の global multiplier

  // 期待分布（月次 KPI で自動調整）
  rateTargets: { S: number; A: number; B: number; C: number };

  // 軸ごとの重み（市場価値に近い軸ほど厚く）
  weights: {
    downstream_outcome: number;      // 2.0  ← KPI 連動の最重要軸
    failure_coverage:   number;      // 1.5
    verifiability:      number;      // 1.5
    originality:        number;      // 1.3
    information_density:number;      // 1.0
    parse_readability:  number;      // 1.0
    presentation:       number;      // 0.6  見栄えだけで稼げないように低め
  };

  // 再現テスト発動条件（リスクベース）
  reproducibilityCheck: {
    sCandidate:          boolean;    // S 候補のみフル実施
    cCandidate:          boolean;    // C 候補は簡易実施
    randomSampleRatio:   number;     // 0.10-0.20 不正抑止用
    newAuthorRatio:      number;     // 新規投稿者は高頻度
    trustedAuthorRatio:  number;     // 信頼実績ある投稿者は軽減
  };

  manualReviewRatio: number;          // S/C 境界 + 灰色案件
  fraudAlertLevel:   number;          // 自動拒否の閾値（高いほど即拒否寄り）
}
```

---

## 市場フェーズ別の推奨パラメータ

| パラメータ | bootstrap (供給不足) | growth (普及期) | competitive (競争期) | mature (成熟期) |
|---|---|---|---|---|
| reviewStrictness | 0.50 | 0.70 | 0.85 | 0.92 |
| S rate target | 10% | 5% | 3% | 3% |
| A rate target | 25% | 20% | 15% | 12% |
| B rate target | 45% | 50% | 50% | 50% |
| C rate target | 20% | 25% | 32% | 35% |
| S 候補再現テスト | YES | YES | YES | YES |
| ランダム監査率 | 5% | 10% | 15% | 20% |
| 人間レビュー率 | 5% | 10% | 12% | 15% |
| 新規投稿者 reproducibility | 50% | 70% | 85% | 90% |

設計判断:
- **初期は甘く** — 供給増加を優先（市場が枯れたら審査の意味がない）
- **成熟期は厳格** — 信頼の希少性を保つ
- **B は常に約 50%** — 多数派を「最低保証」ではなく「改善余地のある通常品質」として位置づけ
- **C は成熟するほど増やす** — マーケットの自浄作用を強化

---

## C と「登録拒否」の明確な分離

| カテゴリ | 定義 | 例 | 処理 |
|---|---|---|---|
| **C ランク** | 価値は低いが**害はない** | 一般論 / 浅いまとめ / テンプレ近似 / 再利用性低 | 登録 OK、隔離層として可視化 |
| **登録拒否** | **市場品質を毀損する** | 虚偽実績 / 著作権侵害 / 個人情報漏洩 / 明確なコピペ / 悪意誘導 | 自動 lint で即拒否、グレーは人間レビュー |

「**低品質 = C / 危険物 = 拒否**」を分離することで、改善希望者を C で救済しつつ、悪意ある投稿は隔離。

---

## 検証可能性主義（出典公開主義ではない）

企業ノウハウは価値が高い一方、**出典を公開できない**ことが多い。
URL 公開を必須にすると、最も価値の高い経験知が登録されない。

採用する代替検証方法:

| 方法 | 受理基準 |
|---|---|
| Git commit hash | プロジェクト URL は private でも commit hash があれば OK |
| タイムスタンプ付き作成履歴 | "この知見は 2024-XX に発生した" 等の時系列整合性 |
| Redacted 版ログ | 顧客名・固有 ID をマスクしたログでも具体的なら可 |
| 第三者確認済みフラグ | レビュアー（社内別人 / 外部監査）の attestation |
| 内部一貫性 | 数値計算が成立するか / 矛盾しないか の機械チェック |

評価軸:
- 公開ソースで確認できるか **ではなく**
- **具体性 / 数値整合性 / 再現手順 / 内部一貫性** で評価

---

## 評価フロー（パイプライン）

```
[MD 提出]
   │
   ▼
[1. 自動 lint] ── 認証情報露出 / 剽窃 ≥ 30% / 架空実績パターン
   │   ├─ HIT → 即拒否（fraudAlertLevel ≥ 0.8 のとき）
   │   └─ グレー → manualReviewQueue へ
   ▼
[2. 5 軸シグナル計測]（全件）
   │
   ▼
[3. policy.weights による複合スコア計算]
   │
   ▼
[4. 絶対閾値判定]
   │   reviewStrictness × 基本閾値 = 動的閾値で S/A/B/C を仮判定
   ▼
[5. 相対 cap 適用]
   │   S 候補が rateTargets.S を超えていたら下位を A に降格
   ▼
[6. 再現テスト]
   │   ├ S 候補         : フル実施（高性能モデル）
   │   ├ C 候補         : 簡易実施（軽量モデル）
   │   ├ ランダム監査   : randomSampleRatio
   │   ├ 新規投稿者     : newAuthorRatio で増やす
   │   └ 信頼投稿者     : trustedAuthorRatio で減らす
   │   ・S 候補が reproducibility ≥ 0.7 → C に降格
   │   ・C 候補が reproducibility ≥ 0.7 → 拒否候補
   ▼
[7. 人間レビュー]
   │   manualReviewRatio で抽出（S/C 境界 + 自動信頼度 < 0.6）
   ▼
[8. 二層レスポンス出力]
       ├─ 公開（著者・買い手）: 説明責任部分のみ
       └─ 非公開（DB 内部保管） : 厳密閾値 / 重み / fraud_score
```

---

## 二層レスポンス（透明性 vs ハック耐性）

### 公開（著者・買い手・他 AI 向け）

```json
{
  "rank": "S",
  "score_band": "high",
  "top_strengths": [
    "失敗例の網羅性",
    "再現可能な数値出典"
  ],
  "improvement_hints": [
    "用語ゆらぎが 5% 検出されました（'API キー' の表記揺れ）"
  ],
  "next_step_to_higher_rank": null,
  "audited_at": "2026-04-30T12:34:56Z",
  "policy_version": "growth-v3-2026-04"
}
```

公開原則:
- ✅ ランク・大分類スコア・落選理由カテゴリ・改善ポイント
- ❌ 厳密閾値・特徴量詳細・モデル重み・不正検知ロジック

### 非公開（DB 保管・社内分析・監査）

```json
{
  "rank_decision_path": [
    "originality 91 ≥ thresholdAt(reviewStrictness=0.70) = 56 ✓",
    "failure_coverage 78 ≥ 49 ✓",
    "S 候補で reproducibility 0.12 < 0.7 → S 維持",
    "S rate cap (5%) 内に収まる → S 確定"
  ],
  "raw_signals": {
    "term_consistency_pct": 98.2,
    "info_density_per_kt": 0.82,
    "n_specific_numerics": 47,
    "general_statement_ratio": 0.08
  },
  "weights_applied": { "downstream_outcome": 2.0, "failure_coverage": 1.5, "...": "..." },
  "fraud_score": 0.04,
  "reproducibility_score": 0.12,
  "policy_snapshot": { "phase": "growth", "strictness": 0.70 },
  "manual_review": { "required": false, "queue_priority": 0 }
}
```

---

## KPI 連動の policy 自動調整

月次バッチで以下を測定 → policy を更新:

| KPI | 測定 | 反映 |
|---|---|---|
| **成約率（rank 別）** | rank=S/A/B/C ごとの購入率 | S の成約率 < A → S が信頼を失っている → reviewStrictness 上昇 |
| **リピート率** | 同一買い手が同 rank を再購入する率 | 高 → そのランクは信頼されている |
| **返金率** | rank 別 | S の返金率 > A → S が緩い → S 閾値を上げる |
| **downstream_outcome** | 買い手 AI が API 経由で利用したノートの **下流タスク成功率** | 全軸の重みを KPI 寄与に応じて補正 |

調整例:
```
2026-05 KPI: S 返金率 8% > A 返金率 3%
→ policy.reviewStrictness: 0.70 → 0.78
→ policy.weights.failure_coverage: 1.5 → 1.7
→ policy_version: "growth-v4-2026-05"
```

---

## 実装に落とすときのファイル構成

```
src/lib/ai-auditor/
├── index.ts              # 既存 audit() を policy 受け取り版に拡張
├── policy.ts             # MarketPolicy + defaults + KPI ローダ
├── dimensions/
│   ├── information-density.ts
│   ├── originality.ts
│   ├── failure-coverage.ts
│   ├── verifiability.ts
│   └── parse-readability.ts
├── disqualifiers.ts      # 自動 lint（剽窃 / 認証情報 / 架空実績）
├── reproducibility.ts    # LLM 再生産テスト（軽量 + 高性能の二層）
├── responses.ts          # 公開/非公開の二層レスポンス分離
└── kpi-feedback.ts       # 月次 policy 更新ジョブ
```

DB スキーマ追加候補:
- `audit_policies` (policy_version, params jsonb, effective_from, effective_to)
- `audit_results` (md_id, policy_version, public_response jsonb, private_response jsonb)
- `audit_kpis_monthly` (year_month, rank_band, conversion_rate, refund_rate, ...)

---

## 設計の最終結論

GUILD AI の審査制度は **固定ルールではなく、観測可能なマーケット KPI に学習する制度**。

```json
{
  "market_phase": "growth",
  "review_strictness": 0.72,
  "s_rate_target": 0.05,
  "manual_review_ratio": 0.12,
  "fraud_alert_level": 0.68,
  "policy_version": "growth-v3-2026-04"
}
```

このパラメータが「どの月の・どの市場フェーズの判定だったか」が**監査可能**であり、後から「あの時期の S は今より緩かった」という説明責任が果たせる。

これにより：
- ✅ 良質供給者が増える（初期は甘めで参入促進）
- ✅ 市場が荒れない（成熟期に厳格化、KPI 連動で自浄）
- ✅ 買い手 AI が成果を出せる（downstream_outcome を最重要軸に）
- ✅ ハック耐性（厳密閾値は非公開）と説明責任（カテゴリ理由は公開）を両立
