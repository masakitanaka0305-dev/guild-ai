export interface RoyaltyDistribution {
  author: number;
  platform: number;
  indexFund: number;
}

export function distribute(perCallJpy: number): RoyaltyDistribution {
  return {
    author:    perCallJpy,
    platform:  0,
    indexFund: 0,
  };
}
