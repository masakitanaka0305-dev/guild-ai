// Centralized nav configuration — page titles and nav items

export const PAGE_TITLES: Record<string, string> = {
  "/":                 "ホーム",
  "/bank":             "投稿",
  "/sell":             "出品",
  "/guild":            "マイ銀行",
  "/jobs":             "案件",
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
};

export const DEFAULT_TITLE = "GUILD AI";

/** Returns the page title for a given pathname, falling back to DEFAULT_TITLE. */
export function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Match prefix segments (e.g. /asset/xxx → "アセット詳細")
  if (pathname.startsWith("/asset/")) return "アセット詳細";
  if (pathname.startsWith("/lineage/")) return "家系図";
  if (pathname.startsWith("/feed/")) return "フィード";
  if (pathname.startsWith("/profile/")) return "プロフィール";
  return DEFAULT_TITLE;
}

/** Returns true when the back button should be shown (not on root pages). */
export function showBackButton(pathname: string): boolean {
  const rootPaths = ["/", "/bank", "/jobs", "/guild", "/marketplace", "/showcase"];
  return !rootPaths.includes(pathname);
}
