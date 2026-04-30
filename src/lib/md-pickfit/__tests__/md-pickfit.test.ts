import { describe, it, expect } from "vitest";
import { pickBestFitMd } from "@/lib/md-pickfit";
import { MOCK_PROJECTS } from "@/lib/projects";
import type { OwnedMd } from "@/lib/matching";

describe("AI Pre-select — pickBestFitMd", () => {
  const proj = MOCK_PROJECTS[0]; // requires md_observability(A,3) / md_infra_go(A,2) / md_slo_policy(B,1)

  it("is deterministic — same input always returns the same MD id", () => {
    const owned: OwnedMd[] = [
      { id: "md_observability", rank: "A" },
      { id: "md_infra_go",      rank: "B" },
      { id: "md_ml_pipeline",   rank: "A" },
    ];
    const a = pickBestFitMd(owned, proj);
    const b = pickBestFitMd([...owned].reverse(), proj);
    expect(a.mdId).toBe(b.mdId);
    expect(a.mdId).toBe("md_observability");
  });

  it("picks the MD with the highest weighted match against requirements", () => {
    const owned: OwnedMd[] = [
      // md_observability satisfies one A-requirement (rankMin A, weight 3) at rank A → 3 × 2 = 6
      { id: "md_observability", rank: "A" },
      // md_infra_go is required at rankMin A but only owned at rank B → does NOT cover
      { id: "md_infra_go",      rank: "B" },
      // unrelated, should never win
      { id: "md_react_native",  rank: "S" },
    ];
    const result = pickBestFitMd(owned, proj);
    expect(result.mdId).toBe("md_observability");
    expect(result.coveredReqs).toBe(1);
    expect(result.rankScore).toBe(6);
    expect(result.reason).toContain("自動でおすすめを選択しました");
  });

  it("breaks ties by higher rank when covered count and weighted score match", () => {
    // Both candidates would cover 0 requirements (project only takes
    // md_observability / md_infra_go / md_slo_policy); fall back to highest-rank.
    const owned: OwnedMd[] = [
      { id: "md_react_native",  rank: "B" },
      { id: "md_compliance",    rank: "S" },
    ];
    const result = pickBestFitMd(owned, proj);
    expect(result.mdId).toBe("md_compliance");
    expect(result.reason).toContain("完全一致なし");
  });

  it("returns mdId=null when the portfolio is empty (UI no-op)", () => {
    const result = pickBestFitMd([], proj);
    expect(result.mdId).toBeNull();
  });
});
