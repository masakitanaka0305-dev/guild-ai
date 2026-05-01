// GUILD AI — Mint pipeline (#123)
//
// Static, ordered description of the four steps that turn a memo into
// a 知恵のカード. Surfaces on /mint via <HexagonSteps>.
//
// The pipeline is intentionally static: no real work happens here, but
// the four steps tell the user that we read, identify, appraise, and
// then store the memo with a tamper-evident hash.

export type MintStepId =
  | "scan"
  | "identify-context"
  | "appraise-value"
  | "hashed-on-chain";

export interface MintStep {
  id: MintStepId;
  /** Friendly Japanese label shown beneath the hex. */
  label: string;
  /** English subtitle (parens) — kept verbatim per spec. */
  subtitle: string;
  /** One-line explanation in friendly Japanese. */
  description: string;
  /** lucide icon name to render at the top of the card. */
  icon: "ScanSearch" | "Target" | "Gem" | "Lock";
}

export const MINT_STEPS: readonly MintStep[] = [
  {
    id:          "scan",
    label:       "読みとる",
    subtitle:    "Scan",
    description: "コードや文章を AI が読みとります",
    icon:        "ScanSearch",
  },
  {
    id:          "identify-context",
    label:       "意味を見つける",
    subtitle:    "Identify Context",
    description: "何の場面で役立つかを判定",
    icon:        "Target",
  },
  {
    id:          "appraise-value",
    label:       "値段をつける",
    subtitle:    "Appraise Value",
    description: "市場価値を鑑定して、太鼓判を準備",
    icon:        "Gem",
  },
  {
    id:          "hashed-on-chain",
    label:       "大切に保管",
    subtitle:    "Hashed on Chain",
    description: "コピーされないように電子の印鑑を押します",
    icon:        "Lock",
  },
] as const;

export const MINT_IMPORTS = [
  {
    id:    "md-upload",
    label: "メモを直接アップロード",
    description: "Markdown / テキストをそのまま送る",
  },
  {
    id:    "github",
    label: "GitHub からインポート",
    description: "コードベースを読み取って下書きを作る",
  },
  {
    id:    "slack",
    label: "Slack インポート",
    description: "チャンネルから知恵の元になりそうな投稿を抜き出す",
  },
] as const;
