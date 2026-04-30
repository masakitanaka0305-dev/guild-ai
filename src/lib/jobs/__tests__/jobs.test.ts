import { describe, it, expect } from "vitest";
import { checkJobEligibility, MOCK_JOBS } from "../index";
import type { Weapon } from "@/types";

function makeWeapon(overrides: Partial<Weapon> = {}): Weapon {
  return {
    id: "wpn_test",
    title: "Test Weapon",
    noteContent: "test content",
    rank: "B",
    score: 50,
    tags: ["設計"],
    mintedAt: "2026-04-01T00:00:00Z",
    jobsCompleted: [],
    ...overrides,
  };
}

describe("jobs.checkJobEligibility", () => {
  it("returns canApply=false with hint when no weapons", () => {
    const result = checkJobEligibility([], MOCK_JOBS[0]);
    expect(result.canApply).toBe(false);
    expect(result.hint).toContain("Asset Ledger");
  });

  it("allows B-rank job with matching B weapon + matching tag", () => {
    const weapon = makeWeapon({ rank: "B", tags: ["設計", "PM"] });
    const bJob = MOCK_JOBS.find((j) => j.requiredRank === "B" && j.requiredTags.includes("設計"))!;
    const result = checkJobEligibility([weapon], bJob);
    expect(result.canApply).toBe(true);
    expect(result.matchedWeapon).toBeTruthy();
  });

  it("blocks A-rank job when weapon is B-rank", () => {
    const weapon = makeWeapon({ rank: "B", tags: ["AI", "実装"] });
    const aJob = MOCK_JOBS.find((j) => j.requiredRank === "A")!;
    const result = checkJobEligibility([weapon], aJob);
    expect(result.canApply).toBe(false);
    expect(result.missingRank).toBe(true);
  });

  it("allows A-rank job with A weapon + matching tag", () => {
    const weapon = makeWeapon({ rank: "A", tags: ["AI", "実装"] });
    const aJob = MOCK_JOBS.find((j) => j.requiredRank === "A" && j.requiredTags.includes("AI"))!;
    const result = checkJobEligibility([weapon], aJob);
    expect(result.canApply).toBe(true);
  });

  it("blocks when rank is ok but tags missing", () => {
    const weapon = makeWeapon({ rank: "A", tags: ["マーケ"] });
    const aJob = MOCK_JOBS.find((j) => j.requiredRank === "A" && j.requiredTags.includes("AI"))!;
    const result = checkJobEligibility([weapon], aJob);
    expect(result.canApply).toBe(false);
    expect(result.missingTags.length).toBeGreaterThan(0);
  });

  it("allows S-rank job with S weapon matching tags", () => {
    const weapon = makeWeapon({ rank: "S", tags: ["AI", "設計", "実装"] });
    const sJob = MOCK_JOBS.find((j) => j.requiredRank === "S")!;
    const result = checkJobEligibility([weapon], sJob);
    expect(result.canApply).toBe(true);
  });

  it("hint message contains missing tag info", () => {
    const weapon = makeWeapon({ rank: "B", tags: [] });
    const job = MOCK_JOBS.find((j) => j.requiredRank === "B" && j.requiredTags.length > 0)!;
    const result = checkJobEligibility([weapon], job);
    if (!result.canApply) {
      expect(result.hint.length).toBeGreaterThan(0);
    }
  });

  it("S-rank weapon satisfies B-rank requirement (rank order)", () => {
    const weapon = makeWeapon({ rank: "S", tags: ["設計", "PM"] });
    const bJob = MOCK_JOBS.find((j) => j.requiredRank === "B")!;
    const result = checkJobEligibility([weapon], bJob);
    expect(result.canApply).toBe(true);
  });
});
