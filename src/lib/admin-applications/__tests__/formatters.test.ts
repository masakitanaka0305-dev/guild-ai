import { describe, it, expect } from "vitest";
import { ageBucketFromBirthYear, lastActiveLabel, anonymizedHandle } from "@/lib/admin-applications";
import type { ProfileRow } from "@/db/schema";

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();

function p(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    userId: "u1",
    lastName: null,
    firstName: null,
    prefecture: null,
    birthYear: null,
    primarySkills: null,
    aiGeneratedSummary: null,
    githubStats: null,
    rank: null,
    status: "provisional",
    lastActiveAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as ProfileRow;
}

describe("ageBucketFromBirthYear", () => {
  it("returns null when birthYear missing", () => {
    expect(ageBucketFromBirthYear(null)).toBeNull();
  });
  it("buckets 30代前半 for age 31", () => {
    expect(ageBucketFromBirthYear(CURRENT_YEAR - 31)).toBe("30代前半");
  });
  it("buckets 30代後半 for age 37", () => {
    expect(ageBucketFromBirthYear(CURRENT_YEAR - 37)).toBe("30代後半");
  });
  it("collapses 50+ into single bucket", () => {
    expect(ageBucketFromBirthYear(CURRENT_YEAR - 55)).toBe("50代以上");
    expect(ageBucketFromBirthYear(CURRENT_YEAR - 70)).toBe("50代以上");
  });
});

describe("lastActiveLabel", () => {
  it("「未連携」 when null", () => {
    expect(lastActiveLabel(null)).toBe("未連携");
  });
  it("hours when within a day", () => {
    const t = new Date(Date.now() - 3 * 3600 * 1000);
    expect(lastActiveLabel(t)).toBe("3時間前");
  });
  it("days when within a month", () => {
    const t = new Date(Date.now() - 5 * 24 * 3600 * 1000);
    expect(lastActiveLabel(t)).toBe("5日前");
  });
  it("months when older", () => {
    const t = new Date(Date.now() - 70 * 24 * 3600 * 1000);
    expect(lastActiveLabel(t)).toBe("2ヶ月前");
  });
});

describe("anonymizedHandle", () => {
  it("「佐藤 健.」 for 佐藤 健太 (Japanese first name → first char)", () => {
    expect(anonymizedHandle(p({ lastName: "佐藤", firstName: "健太" }))).toBe("佐藤 健.");
  });
  it("「Sato K.」 for Sato Kenta (Latin first name → uppercase initial)", () => {
    expect(anonymizedHandle(p({ lastName: "Sato", firstName: "kenta" }))).toBe("Sato K.");
  });
  it("just last name when first missing", () => {
    expect(anonymizedHandle(p({ lastName: "佐藤" }))).toBe("佐藤");
  });
  it("「匿名」 when last name missing", () => {
    expect(anonymizedHandle(p({}))).toBe("匿名");
  });
});
