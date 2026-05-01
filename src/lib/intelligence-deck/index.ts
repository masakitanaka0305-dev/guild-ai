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
  { number: 1, title: "登記 (Sync)",  subtitle: "GitHub 連携であなたの思考を抽出" },
  { number: 2, title: "鑑定 (Grade)", subtitle: "AI があなたの専門知能を資産として評価" },
  { number: 3, title: "派遣 (Deploy)", subtitle: "あなたの代わりに働く AI エージェントを企業へ" },
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
