export interface SimulatorInput {
  rank: "S" | "A" | "B";
  perCallJpy: number;
  category: string;
  ccafScore: number;
}

export interface SimulatorResult {
  monthlyMedianJpy: number;
  p10Jpy: number;
  p90Jpy: number;
  expectedCalls: number;
  distributionByDay: number[]; // length 30
}

const CATEGORY_FACTORS: Record<string, number> = {
  typescript: 1.4, rust: 1.2, python: 1.3, llm: 1.8, ai: 1.8,
  prompt: 1.8, css: 1.1, sql: 1.1, react: 1.3, go: 1.2, default: 1.0,
};

const RANK_COEFF: Record<string, number> = { S: 3, A: 2, B: 1 };

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

function lcg(seed: number, i: number): number {
  return ((seed * (i + 1) * 1664525 + 1013904223) >>> 0) % 1000;
}

export function simulateRevenue(input: SimulatorInput): SimulatorResult {
  const { rank, perCallJpy, category, ccafScore } = input;
  const catKey = category.toLowerCase().split(/[\s/:]+/)[0];
  const catFactor = CATEGORY_FACTORS[catKey] ?? CATEGORY_FACTORS.default;
  const rankCoeff = RANK_COEFF[rank] ?? 1;

  const expectedCalls = Math.round(5 * 30 * catFactor * rankCoeff * (1 + ccafScore / 100));
  const monthlyMedianJpy = Math.round(expectedCalls * perCallJpy);
  const p10Jpy = Math.round(monthlyMedianJpy * 0.35);
  const p90Jpy = Math.round(monthlyMedianJpy * 1.90);

  const seed = djb2(`${rank}${perCallJpy}${category}${ccafScore}`);
  const rawDist = Array.from({ length: 30 }, (_, i) => {
    return 0.5 + lcg(seed, i) / 1000; // [0.5, 1.5]
  });
  const rawSum = rawDist.reduce((s, v) => s + v, 0);
  const distributionByDay = rawDist.map((v) =>
    Math.round((v / rawSum) * monthlyMedianJpy),
  );

  return { monthlyMedianJpy, p10Jpy, p90Jpy, expectedCalls, distributionByDay };
}
