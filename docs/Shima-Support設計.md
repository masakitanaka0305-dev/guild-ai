# Shima-Support Agent 設計（#99 Autonomous Operator）

## 概要

全ページに常駐するフローティング・チャットバブル。
FAQ ベースの決定論的応答エンジンで、サポート問い合わせの70%をAIが自動解決する。

## 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/lib/support-agent/index.ts` | セッション管理・FAQ 応答エンジン |
| `src/components/SupportChat.tsx` | グローバルフローティングチャット UI |

## FAQ 応答マップ

| キーワード | 応答内容 |
|-----------|---------|
| ランク / rank / 鑑定 | S/A/B 条件の説明（Shima-Final） |
| 報酬 / 収益 / jpyc / 円 | 報酬発生・受け取り方法 |
| 登録 / 出品 / sell / 投稿 | /sell・/bank の登録パス説明 |
| dispute / 紛争 / 返金 | /disputes ページへの誘導 |
| 法人 / enterprise / プラン | /business のプラン説明 |
| github / scan / bulk | バルク預け入れ機能の説明 |
| (その他) | デフォルト回答（ドキュメント・チケット誘導） |

## UI コンポーネント設計

```
SupportChat
├── フローティングバブル (fixed, bottom-right, z-50)
│   └── open/close トグル
└── チャットウィンドウ (dialog role)
    ├── ヘッダー（Shima のモノグラム + オンライン表示）
    ├── メッセージリスト (スクロール)
    │   ├── agent メッセージ: bg-surface-2, rounded-bl-sm
    │   └── user メッセージ: bg-primary, rounded-br-sm
    ├── クイックリプライ (messages.length ≤ 1 時のみ表示)
    └── テキスト入力 + 送信ボタン
```

## セッション管理

```typescript
createSupportSession(userId): SupportSession  // id: "sup_0001"
sendMessage(sessionId, message): SupportMessage  // agent reply
getSessions(userId): SupportSession[]
```

- セッションは in-memory（ページリロードでリセット）
- 本番では JWT + DB セッションに移行予定

## クイックリプライ

初期状態で4つの FAQ ショートカットを表示:
1. ランクの条件は？
2. 報酬はいつ入る？
3. 紛争を申請したい
4. 法人プランは？

## レイアウト統合

`src/app/layout.tsx` に `<SupportChat />` を追加済み。
全ページで `/disputes`, `/business` も含めてフローティング表示される。
FAB（＋投稿ボタン）と重複しないよう `bottom-24` に配置。
