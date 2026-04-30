# ToS Draft 設計

> 利用規約（Terms of Service）と権利譲渡規約（Transfer Terms）の設計仕様

## 目的

知識資産の商用化にあたり、IP 帰属・NDA 遵守・就業規則違反のリスクを
ユーザー個人に明確に帰属させることで、プラットフォームの中立性を保つ。

## ファイル構成

| ページ | パス | 内容 |
|--------|------|------|
| 利用規約（日英） | `/legal/terms` | 第1〜8条、タブ切替 |
| 権利譲渡規約 | `/legal/transfer` | IP 許諾範囲・損害帰責 |

## 第1〜8条 サマリ

| 条 | タイトル | 要点 |
|----|---------|------|
| 第1条 | 適用範囲 | 本規約への同意タイミング、変更通知義務 |
| 第2条 | ユーザーの保証と表明 | IP 保有・NDA 遵守・就業規則遵守の表明 |
| 第3条 | 権利許諾 | 非独占的・全世界的ライセンス付与、著作権は本人帰属 |
| 第4条 | 違反時のユーザー責任 | **損害賠償・弁護士費用・差止対応はユーザー単独負担**、当社免責・補償義務 |
| 第5条 | 禁止行為 | 営業秘密・無断投稿・雇用主財産の商用化・DDoS 等 |
| 第6条 | 通報・削除・凍結 | /disputes → 審査 → 削除/凍結/没収フロー |
| 第7条 | 免責 | インフラ提供範囲内。当月手数料額を上限とした限定責任 |
| 第8条 | 準拠法・管轄 | 日本法・東京地裁。海外版は別途 |

## 日英切替実装

```tsx
// Client component
const [lang, setLang] = useState<"ja" | "en">("ja");
// <div role="tablist"> + <button role="tab" aria-selected>
// 各 section の body を lang で切替
```

## アコーディオン

```tsx
function Accordion({ article, lang }) {
  const [open, setOpen] = useState(false);
  // <button aria-expanded={open}> ▼/▲
  // {open && <p>body</p>}
}
```

## /legal/transfer 仕様

- 第1〜7条（IP許諾・IP帰属確認義務・引用配分・損害帰責・削除・没収・準拠法）
- 出品確定チェックボックスの遷移先リンクとして利用
- `<article>` + `<section>` セマンティクス

## 同意ログ接続

```
[出品フォーム submit]
  → recordConsent(handle, "2026-04")
    → sha256(JSON.stringify({handle, version, agreedAt}))
    → ConsentRecord を append-only ストアに追加
```

## アクセシビリティ

- `<article>` タグで文書全体をラップ
- 各条文は `<section>` タグ
- チェックボックスは `<label>` でラップ
- タブは `role="tablist"` / `role="tab"` / `aria-selected`
- アコーディオンは `aria-expanded` + `button`

## セキュリティ注意事項

- 本規約は法的拘束力を持つ意図で設計されているが、
  実際の法的効力は日本の弁護士によるレビューが必要
- `shadow-for-employer` / `stealth-employer` / `企業隠蔽` 等の
  反検知機能は ToS 内外問わず一切実装しない
