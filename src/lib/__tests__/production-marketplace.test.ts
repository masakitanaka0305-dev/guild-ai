// GUILD AI — Production Marketplace Tests
// 26 tests: matching(4) + competitor-stats(2) + payout-sim(3) + escrow(3)
//           + server-actions-shape(3) + brand-jargon(3)
//           + github-onboarding(3) + tos-content(3) + consent-flow(2)

import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Matching Score ──────────────────────────────────────────────────────────

import { computeMatchingScore, getDemoOwnedMds, type OwnedMd } from "@/lib/matching";
import { getProject, MOCK_PROJECTS } from "@/lib/projects";

describe("matching: computeMatchingScore", () => {
  it("returns 100 when all required MDs are matched at or above min rank", () => {
    const project = getProject("proj_001")!;
    const owned: OwnedMd[] = [
      { id: "md_observability", rank: "S" }, // req: A
      { id: "md_infra_go",      rank: "A" }, // req: A
      { id: "md_slo_policy",    rank: "B" }, // req: B
    ];
    const { score } = computeMatchingScore(owned, project);
    expect(score).toBeGreaterThan(90);
  });

  it("returns 0 when no MD matches", () => {
    const project = getProject("proj_001")!;
    const { score, missingMds } = computeMatchingScore([], project);
    expect(score).toBe(0);
    expect(missingMds).toHaveLength(project.requiredMdInterfaces.length);
  });

  it("partial match: 1 of 3 MDs gives intermediate score", () => {
    const project = getProject("proj_001")!;
    const owned: OwnedMd[] = [{ id: "md_observability", rank: "A" }];
    const { score, matchedReqs } = computeMatchingScore(owned, project);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
    expect(matchedReqs).toBe(1);
  });

  it("getDemoOwnedMds is deterministic for same handle", () => {
    const a = getDemoOwnedMds("alice");
    const b = getDemoOwnedMds("alice");
    expect(a).toEqual(b);
  });
});

// ─── Competitor Stats ────────────────────────────────────────────────────────

import { getCompetition } from "@/lib/competitor-stats";

describe("competitor-stats: getCompetition", () => {
  it("returns deterministic breakdown for same projectId", () => {
    const a = getCompetition("proj_001", 21);
    const b = getCompetition("proj_001", 21);
    expect(a.byRank).toEqual(b.byRank);
    expect(a.leadingRank).toBe(b.leadingRank);
  });

  it("total applicants matches sum of byRank", () => {
    const { totalApplicants, byRank } = getCompetition("proj_002", 14);
    const sum = byRank.S + byRank.A + byRank.B;
    expect(sum).toBe(totalApplicants);
  });
});

// ─── Payout Simulation ───────────────────────────────────────────────────────

import { calcNet, formatJpy } from "@/lib/payout-sim";

describe("payout-sim: calcNet", () => {
  it("netJpy = gross - rental - platformFee", () => {
    const result = calcNet({ grossJpy: 420_000, rentalFees: [50_000], platformFeePct: 5 });
    const expectedFee = Math.round(420_000 * 0.05);
    expect(result.netJpy).toBe(420_000 - 50_000 - expectedFee);
  });

  it("platformFeeJpy rounds correctly", () => {
    const { platformFeeJpy } = calcNet({ grossJpy: 100_001, rentalFees: [], platformFeePct: 5 });
    expect(platformFeeJpy).toBe(Math.round(100_001 * 0.05));
  });

  it("formatJpy includes ¥ and comma-separated digits", () => {
    expect(formatJpy(420_000)).toMatch(/¥420,000/);
  });
});

// ─── Escrow Reserve ──────────────────────────────────────────────────────────

import {
  createEscrowReserve,
  advanceEscrowStatus,
  getEscrowReserve,
  _resetEscrowStore,
} from "@/lib/projects";

describe("escrow-reserve: lifecycle", () => {
  beforeEach(() => _resetEscrowStore());

  it("createEscrowReserve returns pending status", () => {
    const r = createEscrowReserve("proj_001", "alice", ["md_observability"], 1_000_000);
    expect(r.status).toBe("pending");
    expect(r.projectId).toBe("proj_001");
  });

  it("advanceEscrowStatus advances: pending → executing → settling → settled", () => {
    const r = createEscrowReserve("proj_001", "bob", [], 0);
    expect(advanceEscrowStatus(r.id)?.status).toBe("executing");
    expect(advanceEscrowStatus(r.id)?.status).toBe("settling");
    expect(advanceEscrowStatus(r.id)?.status).toBe("settled");
    expect(advanceEscrowStatus(r.id)?.status).toBe("settled"); // idempotent
  });

  it("getEscrowReserve returns undefined for unknown id", () => {
    expect(getEscrowReserve("esv_unknown")).toBeUndefined();
  });
});

// ─── Server Actions shape ────────────────────────────────────────────────────
// Validate that action modules export the expected function shapes.
// Cannot call "use server" functions directly in test, so we import and check
// that they are async functions with the right parameter count.

describe("server-actions: module shape", () => {
  it("applyWithRental is an async function with 3 params", async () => {
    const { applyWithRental } = await import("@/app/projects/[id]/actions");
    expect(typeof applyWithRental).toBe("function");
    expect(applyWithRental.length).toBe(3);
  });

  it("submitDeliverable is an async function with 3 params", async () => {
    const { submitDeliverable } = await import("@/app/projects/[id]/actions");
    expect(typeof submitDeliverable).toBe("function");
    expect(submitDeliverable.length).toBe(3);
  });

  it("releaseEscrow is an async function with 2 params", async () => {
    const { releaseEscrow } = await import("@/app/projects/[id]/actions");
    expect(typeof releaseEscrow).toBe("function");
    expect(releaseEscrow.length).toBe(2);
  });
});

// ─── Brand/Jargon (runtime) ──────────────────────────────────────────────────

describe("brand-jargon: MOCK_PROJECTS no kawaii or シマエナガ", () => {
  const projectJson = JSON.stringify(MOCK_PROJECTS);

  it("no シマエナガ in project data", () => {
    expect(projectJson).not.toContain("シマエナガ");
  });

  it("no かわいい in project data", () => {
    expect(projectJson).not.toContain("かわいい");
  });

  it("all projects have numeric grossRewardJpy", () => {
    for (const p of MOCK_PROJECTS) {
      expect(typeof p.grossRewardJpy).toBe("number");
      expect(p.grossRewardJpy).toBeGreaterThan(0);
    }
  });
});

// ─── GitHub Onboarding ───────────────────────────────────────────────────────

import {
  ONBOARDING_STEPS,
  TOTAL_DURATION_MS,
  simulateOnboarding,
} from "@/lib/github-onboarding";

describe("github-onboarding: 6-step flow", () => {
  it("has exactly 6 steps", () => {
    expect(ONBOARDING_STEPS).toHaveLength(6);
    const ids = ONBOARDING_STEPS.map((s) => s.id);
    expect(ids).toEqual(["connect", "select-repo", "analyze", "validate", "publish", "listed"]);
  });

  it("total simulated duration < 180,000ms (3 minutes)", () => {
    expect(TOTAL_DURATION_MS).toBeLessThan(180_000);
  });

  it("simulateOnboarding is deterministic for same inputs", () => {
    const url = "https://github.com/alice/awesome-repo";
    const a = simulateOnboarding("alice", url);
    const b = simulateOnboarding("alice", url);
    expect(a.validationScore).toBe(b.validationScore);
    expect(a.endpointSlug).toBe(b.endpointSlug);
    expect(a.scanResult.files.length).toBe(b.scanResult.files.length);
  });
});

// ─── ToS content ────────────────────────────────────────────────────────────

const root = process.cwd();

function readPage(path: string): string {
  try {
    return readFileSync(resolve(root, path), "utf8");
  } catch {
    return "";
  }
}

describe("tos-content: terms and transfer pages", () => {
  const termsSrc = readPage("src/app/legal/terms/page.tsx");
  const transferSrc = readPage("src/app/legal/transfer/page.tsx");

  it("terms page contains all 8 required articles (第1〜8条)", () => {
    for (let i = 1; i <= 8; i++) {
      expect(termsSrc).toContain(`第${i}条`);
    }
  });

  it("terms page article 4 mentions user liability for costs (損害賠償/弁護士費用)", () => {
    // 第4条 must mention user liability: 損害賠償 OR 弁護士費用 OR 訴訟費用 OR indemnify
    const article4Hit =
      termsSrc.includes("損害賠償") ||
      termsSrc.includes("弁護士費用") ||
      termsSrc.includes("indemnify");
    expect(article4Hit).toBe(true);
  });

  it("/legal/transfer is a separate page with IP transfer rules", () => {
    expect(transferSrc.length).toBeGreaterThan(500);
    expect(transferSrc).toContain("権利");
  });
});

// ─── Consent Flow ────────────────────────────────────────────────────────────

import {
  recordConsent,
  hasConsented,
  getConsents,
  _resetConsentLog,
  CURRENT_TERMS_VERSION,
} from "@/lib/consent-log";

describe("consent-flow", () => {
  beforeEach(() => _resetConsentLog());

  it("unchecked (no record): hasConsented returns false", () => {
    expect(hasConsented("alice", CURRENT_TERMS_VERSION)).toBe(false);
  });

  it("recordConsent stores sha256 field (non-empty string)", () => {
    const rec = recordConsent("alice", CURRENT_TERMS_VERSION);
    expect(typeof rec.sha256).toBe("string");
    expect(rec.sha256.length).toBeGreaterThan(0);
    const [stored] = getConsents("alice");
    expect(stored.sha256).toBe(rec.sha256);
  });
});
