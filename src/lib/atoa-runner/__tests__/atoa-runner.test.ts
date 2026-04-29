import { describe, it, expect, beforeEach } from "vitest";
import { instantiateAgent, healthCheck, runWithQA, getInstance, _resetRunner } from "../index";
import { _resetStores } from "@/lib/atoa-escrow";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("atoa-runner (DB integration)", () => {
  beforeEach(async () => {
    await _resetRunner();
    await _resetStores();
  });

  describe("instantiateAgent", () => {
    it("creates an instance with 'running' status and inst_ prefix", async () => {
      const inst = await instantiateAgent("agent-001");
      expect(inst.instanceId).toMatch(/^inst_/);
      expect(inst.agentId).toBe("agent-001");
      expect(inst.status).toBe("running");
      expect(inst.startedAt).toBeGreaterThan(0);
    });

    it("generates unique instanceIds", async () => {
      const a = await instantiateAgent("agent-001");
      const b = await instantiateAgent("agent-001");
      expect(a.instanceId).not.toBe(b.instanceId);
    });
  });

  describe("healthCheck", () => {
    it("returns ok=true for normal agents", async () => {
      const inst = await instantiateAgent("agent-001");
      const result = await healthCheck(inst.instanceId);
      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.checkedAt).toBeGreaterThan(0);
    });

    it("returns ok=false for degraded agent IDs", async () => {
      const inst = await instantiateAgent("agent-degraded-001");
      const result = await healthCheck(inst.instanceId);
      expect(result.ok).toBe(false);
      expect(result.latencyMs).toBe(0);
    });

    it("returns ok=false for unknown instanceId", async () => {
      const result = await healthCheck("inst_nonexistent");
      expect(result.ok).toBe(false);
    });

    it("updates instance status to 'healthy' after passing check", async () => {
      const inst = await instantiateAgent("agent-002");
      await healthCheck(inst.instanceId);
      const updated = await getInstance(inst.instanceId);
      expect(updated?.status).toBe("healthy");
    });
  });

  describe("runWithQA", () => {
    it("returns success=true and non-empty output for healthy agent", async () => {
      const result = await runWithQA("asset-001", "タスクを実行してください");
      expect(result.success).toBe(true);
      expect(result.output.length).toBeGreaterThan(0);
      expect(result.refundIssued).toBe(false);
      expect(result.durationMs).toBeGreaterThan(0);
    });

    it("returns success=false and refundIssued=true for degraded agent", async () => {
      const result = await runWithQA("agent-degraded-x", "some input");
      expect(result.success).toBe(false);
      expect(result.refundIssued).toBe(true);
      expect(result.refundReason).toBeTruthy();
      expect(result.output).toBe("");
    });

    it("output includes input character count", async () => {
      const input = "テスト入力";
      const result = await runWithQA("asset-002", input);
      expect(result.output).toContain(String(input.length));
    });

    it("is deterministic for same agentId", async () => {
      const a = await runWithQA("asset-003", "同じ入力");
      const b = await runWithQA("asset-003", "同じ入力");
      expect(a.output).toBe(b.output);
      expect(a.success).toBe(b.success);
    });
  });
});
