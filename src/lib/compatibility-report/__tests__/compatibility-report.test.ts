import { describe, it, expect } from "vitest";
import {
  buildCompatibilityReport,
  pickTopMatchTag,
  COMPATIBILITY_NO_MATCH_SENTENCE,
} from "@/lib/compatibility-report";
import type { OwnedMd } from "@/lib/matching";
import { getProject } from "@/lib/projects";

const PROJECT = getProject("proj_001")!;

describe("compatibility-report: buildCompatibilityReport", () => {
  it("returns 100% with the topTag sentence when every requirement is owned at min rank", () => {
    const owned: OwnedMd[] = [
      { id: "md_observability", rank: "S" }, // req: A — top weight
      { id: "md_infra_go",      rank: "A" }, // req: A
      { id: "md_slo_policy",    rank: "B" }, // req: B
    ];
    const r = buildCompatibilityReport({ ownedMds: owned, project: PROJECT });
    expect(r.percent).toBe(100);
    expect(r.matched).toBe(3);
    expect(r.total).toBe(3);
    expect(r.unfulfilled).toEqual([]);
    expect(r.contextSentence).toBe(
      "あなたの知能（MD）はこのプロジェクトの「可観測性設計」と高い親和性があります",
    );
    expect(r.fulfilled).toContain("md_observability(S)");
  });

  it("emits the no-match fallback sentence when nothing matches", () => {
    const r = buildCompatibilityReport({
      ownedMds: [{ id: "md_react_native", rank: "B" }],
      project: PROJECT,
    });
    expect(r.contextSentence).toBe(COMPATIBILITY_NO_MATCH_SENTENCE);
    expect(r.fulfilled).toEqual([]);
    expect(r.unfulfilled.length).toBe(PROJECT.requiredMdInterfaces.length);
  });

  it("is deterministic — same input → same output", () => {
    const owned: OwnedMd[] = [
      { id: "md_observability", rank: "A" },
      { id: "md_infra_go",      rank: "A" },
    ];
    const a = buildCompatibilityReport({ ownedMds: owned, project: PROJECT });
    const b = buildCompatibilityReport({ ownedMds: owned, project: PROJECT });
    expect(a).toEqual(b);
  });

  it("attaches a bonus line when github signals show recent activity ≥ 10 commits", () => {
    const owned: OwnedMd[] = [
      { id: "md_observability", rank: "A" },
    ];
    const r = buildCompatibilityReport({
      ownedMds: owned,
      project: PROJECT,
      githubSignals: { commitCount: 18, recentActivity: true },
    });
    expect(r.bonus).toBe("あなたの GitHub 活動が直近 +18 commits");
  });

  it("omits the bonus line when activity is stale or commits are low", () => {
    const owned: OwnedMd[] = [{ id: "md_observability", rank: "A" }];
    const stale = buildCompatibilityReport({
      ownedMds: owned,
      project: PROJECT,
      githubSignals: { commitCount: 30, recentActivity: false },
    });
    const low = buildCompatibilityReport({
      ownedMds: owned,
      project: PROJECT,
      githubSignals: { commitCount: 4, recentActivity: true },
    });
    expect(stale.bonus).toBeUndefined();
    expect(low.bonus).toBeUndefined();
  });
});

describe("compatibility-report: pickTopMatchTag", () => {
  it("picks the highest-weight requirement that the picked MD satisfies", () => {
    const owned: OwnedMd[] = [
      { id: "md_observability", rank: "A" }, // weight 3 — highest
      { id: "md_slo_policy",    rank: "B" }, // weight 1
    ];
    expect(pickTopMatchTag(owned, PROJECT)).toBe("可観測性設計");
  });

  it("returns null when the portfolio is empty", () => {
    expect(pickTopMatchTag([], PROJECT)).toBeNull();
  });
});
