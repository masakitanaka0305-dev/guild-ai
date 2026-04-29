import { describe, it, expect, beforeEach } from "vitest";
import {
  openDispute, autoResolve, getDisputes, getDisputeById,
  _resetDisputeResolver,
  type ClaimType,
} from "@/lib/dispute-resolver";
import {
  createSupportSession, sendMessage, getSessions, getGreeting,
  _resetSupportAgent,
} from "@/lib/support-agent";

// ─── dispute-resolver ─────────────────────────────────────────────────────────

describe("dispute-resolver", () => {
  beforeEach(() => {
    _resetDisputeResolver();
  });

  it("openDispute returns a dispute with id prefix 'dsp_'", () => {
    const d = openDispute({
      claimType: "quality-dispute",
      guildId: "GUILD:TEST001",
      claimantHandle: "alice",
      respondentHandle: "bob",
      description: "The asset does not match the description.",
    });
    expect(d.id).toMatch(/^dsp_/);
    expect(d.status).toBe("open");
    expect(d.verdict).toBeUndefined();
  });

  it("autoResolve transitions open dispute to auto-resolved or escalated", () => {
    const d = openDispute({
      claimType: "payment-dispute",
      guildId: "GUILD:TEST002",
      claimantHandle: "carol",
      respondentHandle: "dave",
      description: "Payment was deducted but asset not delivered.",
    });
    const resolved = autoResolve(d.id);
    expect(resolved.status).toMatch(/auto-resolved|escalated/);
    expect(resolved.verdict).toBeDefined();
    expect(resolved.reasoning).toBeTruthy();
  });

  it("plagiarism claim always resolves as creator-wins", () => {
    const d = openDispute({
      claimType: "plagiarism",
      guildId: "GUILD:TEST003",
      claimantHandle: "original-author",
      respondentHandle: "plagiarist",
      description: "My content was copied without attribution.",
    });
    const resolved = autoResolve(d.id);
    expect(resolved.verdict).toBe("creator-wins");
  });

  it("getDisputes returns disputes for the given handle", () => {
    openDispute({ claimType: "quality-dispute", guildId: "GUILD:A", claimantHandle: "user1", respondentHandle: "user2", description: "Test" });
    openDispute({ claimType: "quality-dispute", guildId: "GUILD:B", claimantHandle: "user3", respondentHandle: "user4", description: "Test" });
    const user1Disputes = getDisputes("user1");
    expect(user1Disputes.length).toBe(1);
    expect(user1Disputes[0].claim.claimantHandle).toBe("user1");
  });

  it("getDisputeById returns null for unknown id", () => {
    expect(getDisputeById("dsp_9999")).toBeNull();
  });

  it("autoResolve is deterministic for same input", () => {
    const claim = (type: ClaimType) => ({
      claimType: type,
      guildId: "GUILD:SAME",
      claimantHandle: "x",
      respondentHandle: "y",
      description: "test",
    });
    _resetDisputeResolver();
    const d1 = openDispute(claim("ownership-dispute"));
    const r1 = autoResolve(d1.id);
    _resetDisputeResolver();
    const d2 = openDispute(claim("ownership-dispute"));
    const r2 = autoResolve(d2.id);
    expect(r1.verdict).toBe(r2.verdict);
  });
});

// ─── support-agent ────────────────────────────────────────────────────────────

describe("support-agent", () => {
  beforeEach(() => {
    _resetSupportAgent();
  });

  it("createSupportSession returns a session with greeting message", () => {
    const s = createSupportSession("test-user");
    expect(s.id).toMatch(/^sup_/);
    expect(s.messages.length).toBe(1);
    expect(s.messages[0].role).toBe("agent");
    expect(s.messages[0].content).toBeTruthy();
  });

  it("sendMessage returns an agent reply with content", () => {
    const s = createSupportSession("test-user");
    const reply = sendMessage(s.id, "ランクの条件を教えてください");
    expect(reply.role).toBe("agent");
    expect(reply.content.length).toBeGreaterThan(10);
  });

  it("sendMessage responds to rank keywords", () => {
    const s = createSupportSession("test-user");
    const reply = sendMessage(s.id, "Sランクの条件は？");
    expect(reply.content).toMatch(/ランク|S/);
  });

  it("sendMessage responds to dispute keywords", () => {
    const s = createSupportSession("test-user");
    const reply = sendMessage(s.id, "紛争を申請したい");
    expect(reply.content).toMatch(/disputes|紛争/);
  });

  it("getSessions returns sessions for the user", () => {
    createSupportSession("alice");
    createSupportSession("alice");
    createSupportSession("bob");
    const sessions = getSessions("alice");
    expect(sessions.length).toBe(2);
    expect(sessions.every((s) => s.userId === "alice")).toBe(true);
  });

  it("getGreeting returns a non-empty string", () => {
    expect(getGreeting().length).toBeGreaterThan(0);
  });
});
