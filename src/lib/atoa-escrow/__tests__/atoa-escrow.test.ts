import { describe, it, expect, beforeEach } from "vitest";
import {
  createAtoaEscrow,
  releaseAtoaEscrow,
  refundAtoaEscrow,
  recordMicropayment,
  settleMicropayment,
  getMicropaymentTotal,
  _resetStores,
} from "../index";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("atoa-escrow (DB integration)", () => {
  beforeEach(async () => { await _resetStores(); });

  describe("createAtoaEscrow", () => {
    it("creates a held escrow with correct fields", async () => {
      const session = await createAtoaEscrow("agent-001", "caller-abc", 5000);
      expect(session.id).toMatch(/^esw_/);
      expect(session.agentId).toBe("agent-001");
      expect(session.callerId).toBe("caller-abc");
      expect(session.amount).toBe(5000);
      expect(session.status).toBe("held");
      expect(session.createdAt).toBeGreaterThan(0);
    });

    it("generates unique IDs for multiple sessions", async () => {
      const a = await createAtoaEscrow("agent-001", "caller-1", 1000);
      const b = await createAtoaEscrow("agent-001", "caller-2", 2000);
      expect(a.id).not.toBe(b.id);
    });
  });

  describe("releaseAtoaEscrow", () => {
    it("transitions held → released and sets releasedAt", async () => {
      const session = await createAtoaEscrow("agent-002", "caller-xyz", 3000);
      const released = await releaseAtoaEscrow(session.id);
      expect(released.status).toBe("released");
      expect(released.releasedAt).toBeGreaterThan(0);
    });

    it("throws if escrow not found", async () => {
      await expect(releaseAtoaEscrow("esw_nonexistent")).rejects.toThrow("E404");
    });

    it("throws if already released", async () => {
      const session = await createAtoaEscrow("agent-003", "caller-1", 1000);
      await releaseAtoaEscrow(session.id);
      await expect(releaseAtoaEscrow(session.id)).rejects.toThrow("E409");
    });
  });

  describe("refundAtoaEscrow", () => {
    it("transitions held → refunded", async () => {
      const session = await createAtoaEscrow("agent-004", "caller-1", 2000);
      const refunded = await refundAtoaEscrow(session.id);
      expect(refunded.status).toBe("refunded");
    });

    it("is idempotent on already-refunded sessions", async () => {
      const session = await createAtoaEscrow("agent-005", "caller-1", 1500);
      await refundAtoaEscrow(session.id);
      const second = await refundAtoaEscrow(session.id);
      expect(second.status).toBe("refunded");
    });

    it("throws when refunding a released escrow", async () => {
      const session = await createAtoaEscrow("agent-006", "caller-1", 1000);
      await releaseAtoaEscrow(session.id);
      await expect(refundAtoaEscrow(session.id)).rejects.toThrow("E409");
    });
  });

  describe("recordMicropayment + getMicropaymentTotal", () => {
    it("accumulates calls on the same escrow", async () => {
      const session = await createAtoaEscrow("agent-007", "caller-1", 9000);
      const r1 = await recordMicropayment(session.id, 100);
      const r2 = await recordMicropayment(session.id, 100);
      expect(r1.id).toBe(r2.id);
      expect(r2.callCount).toBe(2);
      expect(r2.totalBilled).toBe(200);
    });

    it("getMicropaymentTotal sums settled records for an agent", async () => {
      const s = await createAtoaEscrow("agent-008", "caller-1", 5000);
      const rec = await recordMicropayment(s.id, 500);
      await recordMicropayment(s.id, 500);
      await settleMicropayment(rec.id);
      const total = await getMicropaymentTotal("agent-008");
      expect(total).toBe(1000);
    });

    it("does not count pending micropayments in total", async () => {
      const s = await createAtoaEscrow("agent-009", "caller-1", 3000);
      await recordMicropayment(s.id, 300);
      expect(await getMicropaymentTotal("agent-009")).toBe(0);
    });
  });
});
