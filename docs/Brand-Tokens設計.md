# GUILD AI — Brand Token 最終版

## プライマリトークン（深青系）

| Token | 値 | 用途 |
|-------|----|------|
| `--primary` / `n-primary` | `#0000CC` | 全 Primary CTA、FAB、アクティブ状態 |
| `--primary-hover` | `#0000A8` | ホバー・プレス状態 |
| `--primary-soft` | `#E5E5FA` | 背景帯・ソフト強調 |
| `--primary-foreground` | `#FFFFFF` | Primary 上の文字色 |

## ネガティブ／エラートークン（赤系）

| Token | 値 | 用途 |
|-------|----|------|
| `--n-negative` | `#E64545` | エラー・マイナス表示（月次変化マイナス等） |
| `--negative` | `#C45757` | フォーム検証エラー（reserved） |

## ゴールドトークン（装飾系）

| Token | 値 | 用途 |
|-------|----|------|
| `--n-gold` | `#D4AF37` | S ランクバッジ、ヒーロー収益数字 |
| `--n-gold-soft` | `#F2DFA0` | ゴールド背景帯 |

## サーフェス系

| Token | 値 | 用途 |
|-------|----|------|
| `--n-bg` | `#FAFAF7` | ページ背景 |
| `--n-surface` | `#FFFFFF` | カード背景 |
| `--n-surface-2` | `#F5F3EE` | セカンダリサーフェス |
| `--n-divider` | `rgba(0,0,0,0.08)` | ディバイダ |

## コントラスト比（WCAG AA 適合）

| 組み合わせ | 比率 |
|-----------|------|
| `#0000CC` on white | 8.6:1 ✓ |
| `#E64545` on white | 3.9:1 ✓（large text） |
| `#D4AF37` on white | 2.1:1（装飾のみ、テキスト非推奨） |
