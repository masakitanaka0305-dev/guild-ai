// GUILD AI — Achievement Wall (#130).
//
// 30 badges across five healthy excitement axes (達成 / 期待 / 所属 /
// 発見 / 上達). Each badge anchors to a concrete past-activity rule,
// not a forecast — same honesty rule as streak-events: we never invent
// "急騰" / "%上昇" copy. Locking & unlocking are pure functions of the
// user's history snapshot so SSR + tests stay deterministic.

export type BadgeAxis =
  | "achievement" // 達成
  | "anticipation" // 期待
  | "belonging" // 所属
  | "discovery" // 発見
  | "mastery"; // 上達

export type BadgeRank = "bronze" | "silver" | "gold" | "legend";

export interface Badge {
  id: string;
  name: string;
  description: string;
  /** A lucide icon name we map at render time. */
  icon: string;
  axis: BadgeAxis;
  rank: BadgeRank;
  /** Plain-language criterion shown both on the locked tile and as
   *  the share-text companion. */
  criteria: string;
}

export interface UserHistory {
  /** Total Mints the user has produced (any rank). */
  mintsTotal: number;
  /** Mints that landed at the S tier. */
  mintsS: number;
  /** Mints that landed at the A tier. */
  mintsA: number;
  /** Mints that landed at the B tier. */
  mintsB: number;
  /** Distinct MD ids registered (覚えた知恵の幅). */
  distinctMds: number;
  /** Cumulative royalty earned in yen. */
  royaltyTotalJpy: number;
  /** Longest royalty streak in days, ever. */
  royaltyStreakDays: number;
  /** API calls in the rolling last 24h. */
  callsLast24h: number;
  /** Cumulative API calls, all-time. */
  callsTotal: number;
  /** Best (highest) weekly adoption count, ever. */
  weeklyAdoptionPeak: number;
  /** Distinct counterparty companies that have inquired. */
  enterpriseInterestCount: number;
  /** Distinct role types covered (Dev / Design / PM / Cross-functional). */
  roleTypesCovered: number;
  /** Hall-of-Fame appearances. */
  hofAppearances: number;
  /** Days since the user joined the platform. */
  daysSinceJoin: number;
  /** Distinct AtoA settlement counterparties (other agents). */
  atoaCounterparties: number;
  /** Times an existing card was re-listed at higher rank (上達 axis). */
  rerankUpgrades: number;
  /** Days the user has come back at least once. */
  loginDays: number;
  /** Distinct industries served (お困りごと の分野ジャンル数). */
  industriesServed: number;
}

// ─── Catalogue ────────────────────────────────────────────────────────────

/**
 * 30 badges. Order is curated so the wall reads "easiest → rarest"
 * top-left to bottom-right.
 *
 * Each badge has a `criteria` test in `evaluateUnlocks`. Locked tiles
 * still surface this string so the user always knows what's needed.
 */
export const BADGES: readonly Badge[] = [
  // 達成 (achievement) — 8
  { id: "first-mint",          name: "First Mint",        icon: "Sparkles",     axis: "achievement", rank: "bronze", description: "最初の知恵カードを発行", criteria: "最初の Mint を 1 件" },
  { id: "mint-veteran",        name: "Mint Veteran",      icon: "Hammer",       axis: "achievement", rank: "silver", description: "知恵を 10 件 Mint", criteria: "Mint 累計 10 件" },
  { id: "mint-master",         name: "Mint Master",       icon: "Trophy",       axis: "achievement", rank: "gold",   description: "知恵を 50 件 Mint", criteria: "Mint 累計 50 件" },
  { id: "bronze-forge",        name: "Bronze Forge",      icon: "Award",        axis: "achievement", rank: "bronze", description: "銅の太鼓判を獲得",     criteria: "B ランク Mint を 1 件" },
  { id: "silver-crafter",      name: "Silver Crafter",    icon: "Award",        axis: "achievement", rank: "silver", description: "銀の太鼓判を獲得",     criteria: "A ランク Mint を 1 件" },
  { id: "gold-master",         name: "Gold Master",       icon: "Award",        axis: "achievement", rank: "gold",   description: "金の太鼓判を獲得",     criteria: "S ランク Mint を 1 件" },
  { id: "s-rank-streak",       name: "S-rank Streak",     icon: "Star",         axis: "achievement", rank: "legend", description: "S ランクを 3 連続",   criteria: "直近 3 件すべて S" },
  { id: "yen-10k-milestone",   name: "¥10,000 Milestone", icon: "PiggyBank",    axis: "achievement", rank: "silver", description: "累計 ¥10,000 を超えた", criteria: "累計お礼 ¥10,000 以上" },

  // 期待 (anticipation) — 5
  { id: "royalty-streak-3",    name: "3-day Royalty",     icon: "Calendar",     axis: "anticipation", rank: "bronze", description: "3 日連続で印税",       criteria: "3 日連続お礼" },
  { id: "royalty-streak-7",    name: "7-day Royalty",     icon: "CalendarDays", axis: "anticipation", rank: "silver", description: "7 日連続で印税",       criteria: "7 日連続お礼" },
  { id: "royalty-streak-30",   name: "30-day Royalty",    icon: "CalendarHeart",axis: "anticipation", rank: "gold",   description: "30 日連続で印税",      criteria: "30 日連続お礼" },
  { id: "calls-100-24h",       name: "100 Calls / 24h",   icon: "Zap",          axis: "anticipation", rank: "silver", description: "24 時間で 100 コール", criteria: "直近 24 時間 100 回" },
  { id: "calls-1000-24h",      name: "1000 Calls / 24h",  icon: "Flame",        axis: "anticipation", rank: "legend", description: "24 時間で 1,000 コール", criteria: "直近 24 時間 1,000 回" },

  // 所属 (belonging) — 5
  { id: "hof-debut",           name: "Hall of Fame Debut",icon: "Crown",        axis: "belonging", rank: "gold",   description: "Hall of Fame に初登場", criteria: "HoF 登場 1 回" },
  { id: "peak-adoption",       name: "Peak Adoption",     icon: "TrendingUp",   axis: "belonging", rank: "silver", description: "週次採用件数が過去最多", criteria: "今週の採用が過去最多" },
  { id: "enterprise-magnet",   name: "Enterprise Magnet", icon: "Building2",    axis: "belonging", rank: "silver", description: "企業 5 社から注目",     criteria: "企業の関心 5 件以上" },
  { id: "atoa-trio",           name: "AtoA Trio",         icon: "Network",      axis: "belonging", rank: "silver", description: "AI 3 社と取引成立",     criteria: "AtoA 取引 3 社" },
  { id: "agent-network-10",    name: "Network of Ten",    icon: "Users",        axis: "belonging", rank: "gold",   description: "AI 10 社と取引成立",   criteria: "AtoA 取引 10 社" },

  // 発見 (discovery) — 6
  { id: "cross-functional-trio",name: "Cross-functional Trio", icon: "Layers", axis: "discovery", rank: "silver", description: "Dev / Design / PM すべて",  criteria: "ジャンル 3 種を Mint" },
  { id: "cross-functional-quartet", name: "Cross-functional Quartet", icon: "Compass", axis: "discovery", rank: "gold", description: "Cross-functional も含めて 4 種", criteria: "ジャンル 4 種を Mint" },
  { id: "industry-explorer-3", name: "Industry Explorer", icon: "Map",          axis: "discovery", rank: "bronze", description: "3 つの分野でお困りごと参加", criteria: "分野 3 種以上" },
  { id: "industry-explorer-5", name: "Industry Wanderer", icon: "Globe",        axis: "discovery", rank: "silver", description: "5 つの分野でお困りごと参加", criteria: "分野 5 種以上" },
  { id: "early-bird",          name: "Early Bird",        icon: "Sunrise",      axis: "discovery", rank: "bronze", description: "登録から 7 日以内に Mint", criteria: "登録 7 日以内に 1 件 Mint" },
  { id: "knowledge-cartographer", name: "Knowledge Cartographer", icon: "MapPin", axis: "discovery", rank: "gold", description: "Knowledge Map を 30 ノード以上", criteria: "登記知恵 30 件以上" },

  // 上達 (mastery) — 6
  { id: "rerank-upgrade",      name: "Re-rank Upgrade",   icon: "ArrowUp",      axis: "mastery", rank: "bronze", description: "1 件のカードのランクが上がった", criteria: "再 Mint で ランクアップ 1 件" },
  { id: "rerank-trio",         name: "Re-rank Trio",      icon: "ChevronsUp",   axis: "mastery", rank: "silver", description: "3 件のカードがランクアップ", criteria: "再 Mint で ランクアップ 3 件" },
  { id: "consistency-30",      name: "Consistency 30",    icon: "Hourglass",    axis: "mastery", rank: "silver", description: "30 日来訪したアーティスト",   criteria: "ログイン 30 日以上" },
  { id: "consistency-100",     name: "Consistency 100",   icon: "Infinity",     axis: "mastery", rank: "gold",   description: "100 日来訪",                criteria: "ログイン 100 日以上" },
  { id: "calls-veteran-1k",    name: "Calls Veteran 1k",  icon: "Activity",     axis: "mastery", rank: "silver", description: "累計 1,000 コール",         criteria: "累計コール 1,000 回" },
  { id: "calls-legend-100k",   name: "Calls Legend 100k", icon: "Rocket",       axis: "mastery", rank: "legend", description: "累計 100,000 コール",        criteria: "累計コール 100,000 回" },
] as const;

export const BADGE_AXIS_LABEL: Record<BadgeAxis, string> = {
  achievement:  "達成",
  anticipation: "期待",
  belonging:    "所属",
  discovery:    "発見",
  mastery:      "上達",
};

export const BADGE_RANK_TONE: Record<BadgeRank, { ring: string; text: string; glow: string }> = {
  bronze: { ring: "ring-[#B45309]/40", text: "text-[#B45309]", glow: "shadow-[0_0_18px_rgba(180,83,9,0.32)]" },
  silver: { ring: "ring-[#94A3B8]/40", text: "text-[#94A3B8]", glow: "shadow-[0_0_18px_rgba(148,163,184,0.30)]" },
  gold:   { ring: "ring-[#F59E0B]/45", text: "text-[#F59E0B]", glow: "shadow-[0_0_22px_rgba(245,158,11,0.42)]" },
  legend: { ring: "ring-[#C4B5FD]/55", text: "text-[#C4B5FD]", glow: "shadow-[0_0_28px_rgba(196,181,253,0.42)]" },
};

// ─── Evaluation ───────────────────────────────────────────────────────────

const PREDICATES: Record<string, (h: UserHistory) => boolean> = {
  "first-mint":              (h) => h.mintsTotal >= 1,
  "mint-veteran":            (h) => h.mintsTotal >= 10,
  "mint-master":             (h) => h.mintsTotal >= 50,
  "bronze-forge":            (h) => h.mintsB >= 1,
  "silver-crafter":          (h) => h.mintsA >= 1,
  "gold-master":             (h) => h.mintsS >= 1,
  "s-rank-streak":           (h) => h.mintsS >= 3,
  "yen-10k-milestone":       (h) => h.royaltyTotalJpy >= 10_000,
  "royalty-streak-3":        (h) => h.royaltyStreakDays >= 3,
  "royalty-streak-7":        (h) => h.royaltyStreakDays >= 7,
  "royalty-streak-30":       (h) => h.royaltyStreakDays >= 30,
  "calls-100-24h":           (h) => h.callsLast24h >= 100,
  "calls-1000-24h":          (h) => h.callsLast24h >= 1_000,
  "hof-debut":               (h) => h.hofAppearances >= 1,
  "peak-adoption":           (h) => h.weeklyAdoptionPeak >= 5,
  "enterprise-magnet":       (h) => h.enterpriseInterestCount >= 5,
  "atoa-trio":               (h) => h.atoaCounterparties >= 3,
  "agent-network-10":        (h) => h.atoaCounterparties >= 10,
  "cross-functional-trio":   (h) => h.roleTypesCovered >= 3,
  "cross-functional-quartet":(h) => h.roleTypesCovered >= 4,
  "industry-explorer-3":     (h) => h.industriesServed >= 3,
  "industry-explorer-5":     (h) => h.industriesServed >= 5,
  "early-bird":              (h) => h.daysSinceJoin <= 7 && h.mintsTotal >= 1,
  "knowledge-cartographer":  (h) => h.distinctMds >= 30,
  "rerank-upgrade":          (h) => h.rerankUpgrades >= 1,
  "rerank-trio":             (h) => h.rerankUpgrades >= 3,
  "consistency-30":          (h) => h.loginDays >= 30,
  "consistency-100":         (h) => h.loginDays >= 100,
  "calls-veteran-1k":        (h) => h.callsTotal >= 1_000,
  "calls-legend-100k":       (h) => h.callsTotal >= 100_000,
};

/**
 * Returns the badges the user has unlocked. Pure function — re-runnable
 * any number of times. Order matches BADGES.
 */
export function evaluateUnlocks(history: UserHistory): Badge[] {
  return BADGES.filter((b) => PREDICATES[b.id]?.(history));
}

/**
 * Returns the share-card text for a badge (used by the share buttons).
 * Includes the platform handle and the badge name; no fabricated stats.
 */
export function buildShareText(handle: string, badge: Badge): string {
  const at = handle.startsWith("@") ? handle : `@${handle}`;
  return `${at} が **${badge.name}** バッジを獲得しました — 知恵を資産に\n${badge.criteria}`;
}

// ─── Demo seed for /profile/achievements ─────────────────────────────────

/**
 * Deterministic demo history used by the achievement page to render a
 * realistic mid-journey state (≈ 11 unlocks out of 30).
 */
export function demoUserHistory(): UserHistory {
  return {
    mintsTotal: 12,
    mintsS: 1,
    mintsA: 4,
    mintsB: 7,
    distinctMds: 12,
    royaltyTotalJpy: 24_800,
    royaltyStreakDays: 4,
    callsLast24h: 132,
    callsTotal: 4_220,
    weeklyAdoptionPeak: 5,
    enterpriseInterestCount: 2,
    roleTypesCovered: 3,
    hofAppearances: 1,
    daysSinceJoin: 28,
    atoaCounterparties: 4,
    rerankUpgrades: 1,
    loginDays: 21,
    industriesServed: 3,
  };
}

export const TOTAL_BADGES = BADGES.length;
