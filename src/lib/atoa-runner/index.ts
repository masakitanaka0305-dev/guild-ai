// GUILD AI — AtoA Runner (Postgres-backed)
// Lifecycle: instantiate → run → health check → release escrow (or refund on failure)

import { eq } from "drizzle-orm";
import type { AgentInstance, HealthCheckResult, AtoaRunResult } from "@/types";
import { db } from "@/db/client";
import { agentInstances } from "@/db/schema";
import {
  createAtoaEscrow, releaseAtoaEscrow, refundAtoaEscrow, recordMicropayment,
} from "@/lib/atoa-escrow";

let instanceCounter = 0;

type AgentInstanceRow = typeof agentInstances.$inferSelect;

function rowToInstance(row: AgentInstanceRow): AgentInstance {
  return {
    instanceId: row.instanceId,
    agentId: row.agentId,
    startedAt: row.startedAt.getTime(),
    status: row.status,
  };
}

// Deterministic health: agents with "degraded" in their id always fail (test hook)
function isHealthy(agentId: string): boolean {
  return !agentId.includes("degraded");
}

export async function instantiateAgent(agentId: string): Promise<AgentInstance> {
  const instanceId = `inst_${Date.now()}_${(++instanceCounter).toString().padStart(4, "0")}`;
  const [row] = await db
    .insert(agentInstances)
    .values({ instanceId, agentId, status: "running" })
    .returning();
  return rowToInstance(row);
}

export async function healthCheck(instanceId: string): Promise<HealthCheckResult> {
  const [row] = await db.select().from(agentInstances).where(eq(agentInstances.instanceId, instanceId));
  if (!row) {
    return { instanceId, ok: false, latencyMs: 0, checkedAt: Date.now() };
  }
  const ok = isHealthy(row.agentId);
  const latencyMs = ok ? 40 + Math.floor(Math.abs(instanceId.charCodeAt(5) * 7) % 120) : 0;
  await db
    .update(agentInstances)
    .set({ status: ok ? "healthy" : "degraded" })
    .where(eq(agentInstances.instanceId, instanceId));
  return { instanceId, ok, latencyMs, checkedAt: Date.now() };
}

export async function stopInstance(instanceId: string): Promise<void> {
  await db
    .update(agentInstances)
    .set({ status: "stopped" })
    .where(eq(agentInstances.instanceId, instanceId));
}

export async function getInstance(instanceId: string): Promise<AgentInstance | undefined> {
  const [row] = await db.select().from(agentInstances).where(eq(agentInstances.instanceId, instanceId));
  return row ? rowToInstance(row) : undefined;
}

/**
 * runWithQA — full AtoA execution pipeline:
 *  1. Create non-custodial escrow
 *  2. Instantiate agent
 *  3. Health check — if degraded → refund escrow and return failure
 *  4. Execute (mocked output generation)
 *  5. Record micropayment
 *  6. Release escrow
 */
export async function runWithQA(
  agentId: string,
  input: string,
  amount = 500
): Promise<AtoaRunResult> {
  const escrow = await createAtoaEscrow(agentId, "system", amount);
  const instance = await instantiateAgent(agentId);
  const health = await healthCheck(instance.instanceId);

  if (!health.ok) {
    await refundAtoaEscrow(escrow.id);
    await stopInstance(instance.instanceId);
    return {
      success: false,
      instanceId: instance.instanceId,
      output: "",
      refundIssued: true,
      refundReason: `健全性チェック失敗 — エージェント ${agentId} は応答不良`,
      durationMs: health.latencyMs,
    };
  }

  // Mock output: deterministic based on agentId + input length
  const outputSeed = agentId.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  const outputVariants = [
    "タスクを受理し、処理を完了しました。",
    "入力を解析し、最適な結果を生成しました。",
    "要求を処理し、レスポンスを送信します。",
    "知能資産が正常に起動し、実行が完了しました。",
  ];
  const output = outputVariants[Math.abs(outputSeed) % outputVariants.length];

  await recordMicropayment(escrow.id, Math.floor(amount / 10));
  await releaseAtoaEscrow(escrow.id);
  await stopInstance(instance.instanceId);

  return {
    success: true,
    instanceId: instance.instanceId,
    output: `${output} (入力文字数: ${input.length})`,
    refundIssued: false,
    durationMs: health.latencyMs + 10,
  };
}

export async function _resetRunner(): Promise<void> {
  await db.delete(agentInstances);
  instanceCounter = 0;
}
