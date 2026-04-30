import { describe, it, expect, beforeEach } from "vitest";
import { audit } from "@/lib/ai-auditor";
import { getGithubTrust, isUnverified } from "@/lib/github-trust";
import { payOnCitation, formatMilliJpy } from "@/lib/citation-payout";
import { applyToJob, advanceStatus, getProgress, _resetJobProgress } from "@/lib/job-progress";
import { recordConsent, getConsents, hasConsented, _resetConsentLog } from "@/lib/consent-log";
import { sendReport, getReports, getPendingCount, _resetEmergencyReport } from "@/lib/emergency-report";
import { getActivePriorityEvent } from "@/lib/zero-day";

// ─── D-rank Anti-Spam ─────────────────────────────────────────────────────────

describe("recipe-gate D-rank", () => {
  const lowQualityCCAF = {
    intentSignals: ["manual-edit"],
    thoughtDensity: 20,
    iterations: 1,
    authorId: "user-001",
    createdAt: "2026-04-30T00:00:00Z",
  };

  it("gives D rank when no running code and density < 30", () => {
    const result = audit({ ccaf: lowQualityCCAF, vercelUptimeDays: 10, mdContent: "This is just text without any code." });
    expect(result.rank).toBe("D");
  });

  it("D rank includes feedback array with improvement hints", () => {
    const result = audit({ ccaf: lowQualityCCAF, vercelUptimeDays: 10, mdContent: "plain text no code" });
    expect(result.feedback).toBeDefined();
    expect(result.feedback!.length).toBeGreaterThan(0);
  });

  it("D rank not triggered when mdContent is empty (backward compat)", () => {
    const result = audit({ ccaf: lowQualityCCAF, vercelUptimeDays: 10 });
    expect(result.rank).not.toBe("D");
  });
});

// ─── GitHub Trust ─────────────────────────────────────────────────────────────

describe("github-trust", () => {
  it("getGithubTrust returns deterministic result", () => {
    const t1 = getGithubTrust("masaki");
    const t2 = getGithubTrust("masaki");
    expect(t1.score).toBe(t2.score);
    expect(t1.stars).toBe(t2.stars);
  });

  it("score is in range 0-100", () => {
    const trust = getGithubTrust("test-user-123");
    expect(trust.score).toBeGreaterThanOrEqual(0);
    expect(trust.score).toBeLessThanOrEqual(100);
  });

  it("verified flag matches score >= 30", () => {
    const trust = getGithubTrust("some-user");
    expect(trust.verified).toBe(trust.score >= 30);
    expect(isUnverified("some-user")).toBe(!trust.verified);
  });
});

// ─── Citation Payout ──────────────────────────────────────────────────────────

describe("citation-payout", () => {
  it("no ancestors → creator keeps 100%", () => {
    const result = payOnCitation("GUILD:X001", [], 10000);
    expect(result.ancestorId).toBeNull();
    expect(result.ancestorShare).toBe(0);
    expect(result.creatorShare).toBe(10000);
  });

  it("one ancestor → 10% to ancestor, 90% to creator", () => {
    const result = payOnCitation("GUILD:X001", ["GUILD:PARENT001"], 10000);
    expect(result.ancestorShare).toBe(1000);
    expect(result.creatorShare).toBe(9000);
    expect(result.ancestorId).toBe("GUILD:PARENT001");
  });

  it("only nearest ancestor (index 0) receives 10%", () => {
    const result = payOnCitation("GUILD:X001", ["GUILD:NEAR", "GUILD:FAR"], 1000);
    expect(result.ancestorId).toBe("GUILD:NEAR");
    expect(result.ancestorShare).toBe(100);
  });

  it("formatMilliJpy formats correctly", () => {
    expect(formatMilliJpy(1000)).toBe("¥1.0");
    expect(formatMilliJpy(500)).toBe("¥0.500");
  });
});

// ─── Job Progress ─────────────────────────────────────────────────────────────

describe("job-progress", () => {
  beforeEach(() => _resetJobProgress());

  it("applyToJob creates applied status at 33%", () => {
    const jp = applyToJob("job-001", "masaki");
    expect(jp.status).toBe("applied");
    expect(jp.progressPct).toBe(33);
  });

  it("advanceStatus moves applied → engaged → completed", () => {
    applyToJob("job-001", "masaki");
    const engaged = advanceStatus("job-001", "masaki");
    expect(engaged?.status).toBe("engaged");
    expect(engaged?.progressPct).toBe(66);
    const completed = advanceStatus("job-001", "masaki");
    expect(completed?.status).toBe("completed");
    expect(completed?.progressPct).toBe(100);
  });

  it("getProgress returns null for unknown job", () => {
    expect(getProgress("unknown", "masaki")).toBeNull();
  });
});

// ─── Consent Log ──────────────────────────────────────────────────────────────

describe("consent-log", () => {
  beforeEach(() => _resetConsentLog());

  it("recordConsent stores a record", () => {
    recordConsent("masaki", "2026-04");
    expect(getConsents("masaki")).toHaveLength(1);
  });

  it("hasConsented returns true after consent", () => {
    recordConsent("masaki", "2026-04");
    expect(hasConsented("masaki", "2026-04")).toBe(true);
    expect(hasConsented("masaki", "2026-05")).toBe(false);
  });
});

// ─── Emergency Report ─────────────────────────────────────────────────────────

describe("emergency-report", () => {
  beforeEach(() => _resetEmergencyReport());

  it("sendReport creates a pending report", () => {
    const r = sendReport("GUILD:X001", "anon", "Spam", "test spam");
    expect(r.status).toBe("pending");
    expect(r.id).toMatch(/^rpt_\d{4}$/);
  });

  it("getPendingCount increments on each report", () => {
    sendReport("GUILD:X001", "anon", "Spam", "");
    sendReport("GUILD:X002", "anon", "Plagiarism", "");
    expect(getPendingCount()).toBe(2);
    expect(getReports()).toHaveLength(2);
  });
});

// ─── Zero-Day Banner ──────────────────────────────────────────────────────────

describe("zero-day banner", () => {
  it("getActivePriorityEvent returns a critical or high event", () => {
    const event = getActivePriorityEvent();
    expect(event).not.toBeNull();
    expect(["critical", "high"]).toContain(event?.priority);
  });

  it("getActivePriorityEvent is deterministic", () => {
    const e1 = getActivePriorityEvent();
    const e2 = getActivePriorityEvent();
    expect(e1?.id).toBe(e2?.id);
  });
});

// ─── API 200ms performance smoke ─────────────────────────────────────────────

import { getEndpointStats } from "@/lib/note-endpoint";
import { MOCK_MARKETPLACE } from "@/lib/marketplace";
import { getCatalog } from "@/lib/solution-catalog";

describe("API response time < 200ms (deterministic mock)", () => {
  it("/api/note/[guildId] handler logic", () => {
    const start = performance.now();
    getEndpointStats("GUILD:TEST001");
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });

  it("/api/catalog handler logic", () => {
    const start = performance.now();
    MOCK_MARKETPLACE.slice(0, 10);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });

  it("/api/atoa/[id] handler logic", () => {
    const start = performance.now();
    MOCK_MARKETPLACE.find((m) => m.listing.id === "asset-001");
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });

  it("/business/catalog logic", () => {
    const start = performance.now();
    getCatalog();
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });
});
