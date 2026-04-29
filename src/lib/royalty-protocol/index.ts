export interface RoyaltyDistribution {
  author: number;
  platform: number;
  indexFund: number;
}

export function distribute(perCallJpy: number): RoyaltyDistribution {
  const r = (x: number) => Math.round(x * 1000) / 1000;
  return {
    author:    r(perCallJpy * 0.70),
    platform:  r(perCallJpy * 0.25),
    indexFund: r(perCallJpy * 0.05),
  };
}
