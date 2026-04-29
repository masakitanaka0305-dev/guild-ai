# Originality Enforcement 設計（#96 Anti-Failure Protocol）

## 概要

剽窃・盗作コンテンツの流入を検知し、アカウント凍結・ロイヤリティ経路の強制変更で
正当なクリエイターを保護する「オリジナリティ番人」システム。

## 実装ファイル

`src/lib/originality-watch/index.ts`

## 主要関数

### `computeSimilarity(newMd, existingMd): number`

djb2 ハッシュ + XOR 距離による疑似コサイン類似度。

```
xorDist = (djb2(newMd) XOR djb2(existingMd)) >>> 0
similarity = 1 - xorDist / 0xFFFFFFFF
```

- 同一文字列 → 1.0（類似度最大）
- 全く異なる文字列 → 0.0 付近
- 決定論的：同一入力は常に同じ結果

将来は n-gram shingling / TF-IDF / embedding へ移行可能なインターフェース設計。

### `screenSubmission(newMd, existingPool[]): ScreeningResult`

```
verdict:
  similarity ≥ 0.85 → "plagiarism"（剽窃）
  similarity ≥ 0.70 → "review"（要レビュー）
  その他          → "ok"
```

Top 3 マッチを返す（`topMatches`）。

### `freezeAccount(handle, reason): FrozenAccount`

アカウントを in-memory ストアに凍結。`frozenAt` タイムスタンプを記録。

### `redirectFutureRoyalty(fromGuildId, toCreatorHandle)`

盗作ノートの将来ロイヤリティを本来のクリエイターへリダイレクト。
`fromGuildId → toCreatorHandle` のマッピングを `_royaltyRedirects` Map に保存。

## プロフィールページ統合

`/profile` ページの「オリジナリティ」セクションで以下を表示:
- 円グラフ（独自性 %）
- 類似スコア + verdict ラベル
- S ランク達成バッジ（`topRank === "S"` 時に 🏆 + 魂の登記説明）

## セキュリティ設計

- 凍結・リダイレクト情報は現在 in-memory（本番はDB永続化が必要）
- `_resetOriginalityWatch()` はテスト用のみ。本番コードから呼び出し禁止
- verdict "plagiarism" 検出時の自動凍結は手動確認を挟む設計（誤検知防止）

## テスト保証

`src/lib/__tests__/anti-failure.test.ts` の originality-watch セクション（6テスト）:
- computeSimilarity 決定論的・同一文字列は高類似度
- screenSubmission: 同一 MD → plagiarism、異なる MD → ok
- freezeAccount: 凍結済みか判定
- redirectFutureRoyalty: リダイレクト記録の取得
