# ギルドAI — フリマ感のフレンドリー・トーン設計

> 「プロトコル」ではなく「みんなの知恵のフリマ」。
> やわらかい日本語で、誰でも一目で分かる UI へ。

このドキュメントは Friendly Tone Update（#123）の設計仕様。直前の
プロトコル感（Owned Assets ／ Plugin My Intelligence ／ Project Goals）を
やわらかい日本語に翻訳した上で、太鼓判の色（金・銀・銅）と祝祭感を
組み合わせる。**仮称 Rezon は採用せず、サービス名は「ギルドAI」**で統一。

---

## 1. 用語マッピング（UI 表示のみ）

内部コードの識別子（変数名／ファイル名／関数名）は破壊的変更を避けるため
英語のまま維持する。**置換は UI 表示文字列に限る**。

| 旧（プロトコル感） | 新（フレンドリー） |
|--------------------|--------------------|
| インテリジェンス・アセット／知能資産／Owned Assets | **知恵のカード** |
| ダッシュボード／知能ウォレット／Asset Ledger | **マイページ／もちもの** |
| ミント／資産化／Intelligence Minting／登記 | **知恵を出品する**（CTA） |
| プラグイン／デプロイ／知能をプラグインする／Plugin My Intelligence | **知恵を貸す（参加する）**（CTA） |
| ロイヤリティ／印税 | **使われた分のお金（お礼）** |
| ランク S/A/B/D | **太鼓判（金・銀・銅）／みならい** |
| RAG | **AIの参考書** |
| Project／案件／Project Goals | **お困りごと** |
| Required Intelligence／必要な知能 | **ほしい知恵** |
| Compatibility Report／適合率 | **マッチ度** |
| Connected Intelligence Assets | **つながっている知恵のカード**（補助） |
| 応募する／この案件に応募する | **参加する** |
| 投稿する／公開する | **出品する** |
| 鑑定 | **太鼓判のチェック**（一部内部用語は維持） |
| 印税が入りました | **お礼が届きました** |
| 採用されました | **選ばれました** |
| 累計報酬 | **これまでのお礼** |
| 受領通貨 | **お礼の受け取り方** |

---

## 2. 太鼓判（ランクバッジ）の色とラベル

`@/lib/grading` の `RANK_COLOR_TOKEN` ／ `RANK_TIER` ／ `RANK_SUB_LABEL` を更新：

| Rank | Tier | Fill | Sub-label |
|------|------|------|-----------|
| S | 金 | `#FDE047`（既存維持） | 金の太鼓判。市場価値トップ1% |
| A | 銀 | `#CBD5E1` ← `#22D3EE` から変更 | 銀の太鼓判。すぐ役立つ即戦力の知恵 |
| B | 銅 | `#D2A06B` ← `#34D399` から変更 | 銅の太鼓判。これからもっと光る知恵 |
| D | みならい | `#94A3B8`（既存維持） | みならい。育成枠の知恵 |

`<HexRankBadge showSubLabel />` で日本語サブラベルと併記。

---

## 3. 主要画面の翻訳

### 3.1 /guild — マイページ — もちもの

```
[h1]      マイページ — もちもの
[sub]     あなたの知恵のカードと、これまでのお礼を一覧にしています。

[card]    Owned Assets セクション
          - 知恵のカード一覧（N 枚）
          - もちもの時価のうごき（過去 30 日）
          - 今のあなたの価値：¥1,248,400 (cyan metric-prime)
          - ▲/▼ N%（30 日）
[asset]   Type pill：作り方のコツ／見た目の工夫／進め方の相談／色んな分野
[asset]   Status pill：自分だけ／鍵つき／お貸出し中
[asset]   Rank：HexRankBadge 金/銀/銅/みならい
```

### 3.2 /mint — 取っておきのメモを教えてください

```
[h1]      取っておきのメモを教えてください
[sub]     あなたのコツや工夫が、世界の AI に貸し出される 知恵のカード に変わります。

[choose]  メモを直接アップロード／GitHub からインポート／Slack インポート

[steps]   1. 読みとる（Scan）       — コードや文章を AI が読みとります
          2. 意味を見つける（Identify Context） — 何の場面で役立つかを判定
          3. 値段をつける（Appraise Value）     — 市場価値を鑑定して、太鼓判を準備
          4. 大切に保管（Hashed on Chain）       — コピーされないように電子の印鑑を押します

[done]    おめでとうございます！
          これは 仕事の場面 で役立つ、金 の太鼓判レベルの知恵ですね！
          [HexRankBadge S 64px]  [Shielded badge: 🛡 大手 AI のクローラから守られています]
```

### 3.3 /projects — みんなの お困りごと

```
[h1]      みんなの お困りごと
[sub]     企業の困りごとに、あなたの知恵のカードを貸してみませんか？

[entry]   参加状況を見る → /applications

[table]   困りごと | 分野 | マッチ度 | 想定お礼 | 締切 | 中身を見る
          (industry friendly：データの仕組みを直したい／仕事に AI を入れたい … )
          recommended badge → 「おすすめ」

[detail]  なぜマッチしているか → ほしい知恵（必要なカード）
          欠落要件のサブ文 → 「持っていません — X 以上」
```

### 3.4 /applications — 参加状況

```
[h1]      参加状況
[banner]  AI が代わりに働いています：あなたの知恵はすでに動いています。

[status]  受付 → 受付中、AI鑑定中 → 働いてます、クライアント確認中 → お礼まち
[pill]    Agent Active → AI が代わりに働いています
[tooltip] 「あなたの参加前から、AI が知恵を活かして動いています」

[empty]   まだ参加していません — お困りごとを探す → /projects
[modal]   参加を取り消しますか？ / いつでもまた参加できます
```

### 3.5 Apply CTA — この知恵を貸す（参加する）

```
[primary]  bg-cyan-400  rounded-full  lucide Plug
           「この知恵を貸す（参加する）」
           aria-label="この知恵を貸す"
           sub-caption: あなたの知恵が、企業のお困りごとを助けます

[loading]  「参加中...」
[done]     emerald disabled pill
           CheckCircle2 ＋ 「貸出中（参加中）」
           aria-label="貸出中"

[modal]    h2  選ばれました！
           p   あなたの知恵のカードを、お困りごとに貸し出しました。…
           CTA 参加状況を見る → → /applications
```

### 3.6 祝祭トースト — お礼が届きました

```
🎉
 おめでとうございます！  ← cyan-300 small
 +¥X,XXX                 ← emerald-300 bold tabular-nums
 お礼が届きました          ← muted slate-400
```

アニメは引き続き **無し**（`data-anim="off"` の方針維持）。色とサイズで祝祭感を演出。

---

## 4. ブランド方針

- **仮称 "Rezon" は不採用。** 既存名 「**ギルドAI**」 を維持
- jargon-lint：`Rezon` ／ `レゾン` を NG 入り
- メタ `<title>`／OG title／フッタの著作権表記等も「ギルドAI」で統一

---

## 5. jargon-lint 差分

### 許可語（#123）

知恵を貸す ／ 知恵のカード ／ もちもの ／ お困りごと ／ ほしい知恵 ／
カードのジャンル ／ 作り方のコツ ／ 見た目の工夫 ／ 進め方の相談 ／
色んな分野 ／ 自分だけ ／ 鍵つき ／ お貸出し中 ／ 取っておきのメモ ／
読みとる ／ 意味を見つける ／ 値段をつける ／ 大切に保管 ／ お礼 ／
参加する ／ 参加中 ／ 受付中 ／ 働いてます ／ お礼まち ／ お礼受領 ／
マッチ度 ／ AIの参考書 ／ 時価のうごき ／ 太鼓判 ／ 金の太鼓判 ／
銀の太鼓判 ／ 銅の太鼓判 ／ みならい ／ 知恵を出品する。

### NG（UI 表示）

- `Rezon` ／ `レゾン`（全 UI）
- `<h1>` 内の英語プロトコル ラベル：`Owned Assets` ／ `Plugin My Intelligence` ／ `Intelligence Minting` ／ `Project Goals` ／ `Required Intelligence`（コメント・識別子・docs では引き続き許可）
- `aria-label="応募する"` ／ `aria-label="この案件に応募する"`（CTA）
- `aria-label="エージェントをデプロイ"`（CTA）

---

## 6. テスト一覧（Friendly Tone）

| テスト | 件数 | 場所 |
|--------|------|------|
| rank-friendly-labels | 4 | `src/lib/__tests__/rank-friendly-labels.test.ts` |
| apply-cta-copy（差し替え） | 7 | `src/lib/__tests__/apply-cta-copy.test.ts` |
| plug-in-flow（文言整合） | 4 | `src/lib/__tests__/plug-in-flow.test.ts` |
| asset-portfolio | 8 | `src/lib/asset-portfolio/__tests__/asset-portfolio.test.ts` |
| mint-pipeline | 7 | `src/lib/mint-pipeline/__tests__/mint-pipeline.test.ts` |
| projects-friendly | 5 | `src/lib/__tests__/projects-friendly.test.ts` |
| agent-active-pill（差し替え） | 6 | `src/lib/__tests__/agent-active-pill.test.ts` |
| jargon-lint Rezon NG ＋ <h1> sweep | +6 | `src/lib/__tests__/jargon-lint.test.ts` |

合計 **40 件以上**（既存ファイル更新も含む）。
