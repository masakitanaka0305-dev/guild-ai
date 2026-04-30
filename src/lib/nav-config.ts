// Centralized nav configuration — page titles and nav items

export const PAGE_TITLES: Record<string, string> = {
  "/":                 "ホーム",
  "/bank":             "投稿",
  "/sell":             "出品",
  "/guild":            "マイ銀行",
  "/jobs":             "案件",
  "/projects":         "案件一覧",
  "/marketplace":      "マーケット",
  "/marketplace/pro":  "法人検索",
  "/profile":          "プロフィール",
  "/profile/stacking": "スタッキング",
  "/disputes":         "紛争解決センター",
  "/business":         "法人向け",
  "/business/checkout":"プラン申し込み",
  "/scout":            "Global Scout",
  "/showcase":         "つくったもの",
  "/wallet":           "お財布",
  "/sdk":              "SDK",
  "/community/citations": "引用ネットワーク",
  "/business/catalog":   "カタログ",
  "/business/presale":   "プリセール",
  "/legal/terms":        "利用規約",
  "/legal/transfer":     "権利譲渡規約",
  "/admin/reports":      "レポート管理",
  "/onboarding":         "Onboarding Express",
  "/applications":       "Applications",
};

export const DEFAULT_TITLE = "GUILD AI";

/** Returns the page title for a given pathname, falling back to DEFAULT_TITLE. */
export function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Match prefix segments (e.g. /asset/xxx → "アセット詳細")
  if (pathname.startsWith("/asset/") && pathname.endsWith("/report")) return "品質保証書";
  if (pathname.startsWith("/asset/")) return "アセット詳細";
  if (pathname.startsWith("/projects/")) return "案件詳細";
  if (pathname.startsWith("/lineage/")) return "家系図";
  if (pathname.startsWith("/feed/")) return "フィード";
  if (pathname.startsWith("/profile/")) return "プロフィール";
  return DEFAULT_TITLE;
}

/** Returns true when the back button should be shown (not on root pages). */
export function showBackButton(pathname: string): boolean {
  const rootPaths = ["/", "/projects", "/onboarding", "/guild", "/bank", "/jobs", "/marketplace", "/showcase"];
  return !rootPaths.includes(pathname);
}

// ── 2-tab main navigation + primary action (center FAB) ──────────────────────
export const MAIN_TABS = [
  { href: "/projects", label: "探す", description: "AI 案件を探す" },
  { href: "/guild",    label: "稼ぐ", description: "Asset Ledger・運用状況" },
] as const;

export const PRIMARY_ACTION = {
  href: "/onboarding",
  label: "出す",
  description: "MD を 3 ステップで出品",
} as const;
