import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const src = readFileSync(
  join(ROOT, "src/app/profile/page.tsx"),
  "utf-8",
);

describe("/profile — tab UI + visible numbers", () => {
  it("renders 3 tabs (status / md / activity) with role=tablist + role=tab", () => {
    expect(src).toMatch(/role="tablist"/);
    expect(src).toMatch(/data-testid="profile-tablist"/);
    // The TABS table lists exactly the 3 tab ids
    expect(src).toMatch(/{ id: "status",\s+label: "ステータス" }/);
    expect(src).toMatch(/{ id: "md",\s+label: "登記済み MD" }/);
    expect(src).toMatch(/{ id: "activity",\s+label: "活動履歴" }/);
    // Each tab uses aria-selected + aria-controls
    expect(src).toMatch(/aria-selected=\{active\}/);
    expect(src).toMatch(/aria-controls=\{`tabpanel-\$\{t\.id\}`\}/);
  });

  it("active tab is text-cyan-400 with a 2px bottom rule, inactive is text-slate-400", () => {
    expect(src).toMatch(/active \? "text-cyan-400" : "text-slate-400 hover:text-white"/);
    expect(src).toMatch(/h-0\.5 bg-cyan-400/);
  });

  it("header surfaces 累計報酬 ¥ and 稼働中 MD as cyan metric-prime numbers", () => {
    expect(src).toContain('data-testid="profile-header"');
    expect(src).toMatch(/累計報酬 ¥/);
    expect(src).toMatch(/稼働中 MD/);
    expect(src).toMatch(/data-testid="profile-cumulative-jpy"[\s\S]{0,200}className="text-cyan-400 metric-prime"/);
    expect(src).toMatch(/data-testid="profile-active-md"[\s\S]{0,200}className="text-cyan-400 metric-prime"/);
    // Labels use the slate-200 spec
    expect(src).toContain("text-[#CBD5E1] text-xs uppercase tracking-wide");
  });

  it("hexagonal rank badge replaces the legacy RankShield in the header", () => {
    expect(src).toContain("HexRankBadge");
    // Phase H: badge size moved from 48 → 80 with showSubLabel.
    expect(src).toMatch(/<HexRankBadge[^>]*size=\{80\}/);
  });

  it("each tabpanel uses role=tabpanel + hidden gate based on activeTab", () => {
    expect(src).toMatch(/id="tabpanel-status"[\s\S]{0,200}hidden=\{activeTab !== "status"\}/);
    expect(src).toMatch(/id="tabpanel-md"[\s\S]{0,200}hidden=\{activeTab !== "md"\}/);
    expect(src).toMatch(/id="tabpanel-activity"[\s\S]{0,200}hidden=\{activeTab !== "activity"\}/);
  });
});
