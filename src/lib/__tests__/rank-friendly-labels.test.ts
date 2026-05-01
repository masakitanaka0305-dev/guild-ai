import { describe, it, expect } from "vitest";
import { RANK_COLOR_TOKEN, RANK_TIER, RANK_SUB_LABEL } from "@/lib/grading";

describe("rank — friendly tone × Logic White (#125)", () => {
  it("S/A/B/D fills are gold #F59E0B / silver #94A3B8 / bronze #B45309 / slate #94A3B8", () => {
    expect(RANK_COLOR_TOKEN.S.fill).toBe("#F59E0B");
    expect(RANK_COLOR_TOKEN.A.fill).toBe("#94A3B8");
    expect(RANK_COLOR_TOKEN.B.fill).toBe("#B45309");
    expect(RANK_COLOR_TOKEN.D.fill).toBe("#94A3B8");
  });

  it("tier labels read 金 / 銀 / 銅 / みならい", () => {
    expect(RANK_TIER.S).toBe("金");
    expect(RANK_TIER.A).toBe("銀");
    expect(RANK_TIER.B).toBe("銅");
    expect(RANK_TIER.D).toBe("みならい");
  });

  it("sub-labels carry the friendly 太鼓判 phrasing", () => {
    expect(RANK_SUB_LABEL.S).toBe("金の太鼓判。市場価値トップ1%");
    expect(RANK_SUB_LABEL.A).toBe("銀の太鼓判。すぐ役立つ即戦力の知恵");
    expect(RANK_SUB_LABEL.B).toBe("銅の太鼓判。これからもっと光る知恵");
    expect(RANK_SUB_LABEL.D).toBe("みならい。育成枠の知恵");
  });

  it("text utility classes match each rank's Logic White fill", () => {
    expect(RANK_COLOR_TOKEN.S.text).toBe("text-[#F59E0B]");
    expect(RANK_COLOR_TOKEN.A.text).toBe("text-[#94A3B8]");
    expect(RANK_COLOR_TOKEN.B.text).toBe("text-[#B45309]");
    expect(RANK_COLOR_TOKEN.D.text).toBe("text-slate-400");
  });
});
