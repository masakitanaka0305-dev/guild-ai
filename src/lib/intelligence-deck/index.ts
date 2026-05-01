// GUILD AI — Intelligence Deck
// Static onboarding home: three-step roadmap + cyan hero CTA.
// Numbers are deterministic mocks for "ギルド感" (guild atmosphere).

export interface DeckStep {
  number: 1 | 2 | 3;
  /** Japanese title with the English action verb in parens. */
  title: string;
  /** Single-line subtitle, ≤ 30 zenkaku chars. */
  subtitle: string;
}

export const DECK_STEPS: readonly DeckStep[] = [
  { number: 1, title: "あなたのコツ（メモ）を見つける", subtitle: "GitHub と連携して、あなたが書いてきた『工夫』を AI が読みとります" },
  { number: 2, title: "そのコツの価値を鑑定する",      subtitle: "金・銀・銅の太鼓判で、市場での読み応えをチェックします" },
  { number: 3, title: "分身AIが企業で働き始める",      subtitle: "あなたの代わりに、知恵カードが企業のお困りごとを助けます" },
] as const;

/**
 * Returns the current registered-agent count for the Intelligence Deck.
 * Static mock — kept here so tests can pin the value and copy stays
 * out of the page module.
 */
export function getRegisteredAgents(): number {
  return 1284;
}

/** Recent-24h delta, for the small slate-400 caption beneath the count. */
export function getRecentAgentsDelta24h(): number {
  return 18;
}

/** Formats the count with ja-JP grouping ("1,284"). */
export function formatAgentCount(n: number): string {
  return new Intl.NumberFormat("ja-JP").format(n);
}
