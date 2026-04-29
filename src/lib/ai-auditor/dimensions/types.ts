// Shared types for v1 dimension scorers.

export interface DimensionScore {
  score: number;                          // 0..100
  signals: Record<string, number | string | boolean>;  // raw signal breakdown for debug / private response
}

export type DimensionName =
  | "information_density"
  | "originality"
  | "failure_coverage"
  | "verifiability"
  | "parse_readability";
