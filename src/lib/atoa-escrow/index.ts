// GUILD AI — AtoA Escrow + Micropayment Billing (Postgres-backed)
// Non-custodial escrow for autonomous Agent-to-Agent transactions.
// State: held → released | refunded. Atomic transitions via conditional UPDATE.

import { and, eq, sql } from "drizzle-orm";
import type { AtoaEscrowSession, MicropaymentRecord } from "@/types";
import { db } from "@/db/client";
import { atoaEscrowSessions, atoaMicropayments } from "@/db/schema";

let escrowCounter = 0;
let payCounter = 0;

type AtoaEscrowRow = typeof atoaEscrowSessions.$inferSelect;
type AtoaMicropayRow = typeof atoaMicropayments.$inferSelect;

function rowToSession(row: AtoaEscrowRow): AtoaEscrowSession {
  return {
    id: row.id,
    agentId: row.agentId,
    callerId: row.callerId,
    amount: row.amount,
    status: row.status,
    createdAt: row.createdAt.getTime(),
    releasedAt: row.releasedAt?.getTime(),
  };
}

function rowToMicropay(row: AtoaMicropayRow): MicropaymentRecord {
  return {
    id: row.id,
    escrowId: row.escrowId,
    agentId: row.agentId,
    perCallAmount: row.perCallAmount,
    callCount: row.callCount,
    totalBilled: row.totalBilled,
    status: row.status,
  };
}

export async function createAtoaEscrow(
  agentId: string,
  callerId: string,
  amount: number
): Promise<AtoaEscrowSession> {
  const id = `esw_${Date.now()}_${(++escrowCounter).toString().padStart(4, "0")}`;
  const [row] = await db
    .insert(atoaEscrowSessions)
    .values({ id, agentId, callerId, amount, status: "held" })
    .returning();
  return rowToSession(row);
}

export async function releaseAtoaEscrow(id: string): Promise<AtoaEscrowSession> {
  // Atomic: only flip held → released. Returns no row if status differs / missing.
  const [row] = await db
    .update(atoaEscrowSessions)
    .set({ status: "released", releasedAt: new Date() })
    .where(and(eq(atoaEscrowSessions.id, id), eq(atoaEscrowSessions.status, "held")))
    .returning();

  if (!row) {
    // Distinguish missing vs wrong-status to preserve original error semantics.
    const [existing] = await db.select().from(atoaEscrowSessions).where(eq(atoaEscrowSessions.id, id));
    if (!existing) throw new Error(`GUILD-E404: Escrow session ${id} not found`);
    throw new Error(`GUILD-E409: Cannot release escrow in status "${existing.status}"`);
  }
  return rowToSession(row);
}

export async function refundAtoaEscrow(id: string): Promise<AtoaEscrowSession> {
  // Look up first to handle the idempotent-on-refunded case.
  const [existing] = await db.select().from(atoaEscrowSessions).where(eq(atoaEscrowSessions.id, id));
  if (!existing) throw new Error(`GUILD-E404: Escrow session ${id} not found`);
  if (existing.status === "refunded") return rowToSession(existing); // idempotent
  if (existing.status === "released") {
    throw new Error(`GUILD-E409: Cannot refund already-released escrow`);
  }

  const [row] = await db
    .update(atoaEscrowSessions)
    .set({ status: "refunded", releasedAt: new Date() })
    .where(and(eq(atoaEscrowSessions.id, id), eq(atoaEscrowSessions.status, "held")))
    .returning();
  return rowToSession(row!);
}

export async function getAtoaEscrow(id: string): Promise<AtoaEscrowSession | undefined> {
  const [row] = await db.select().from(atoaEscrowSessions).where(eq(atoaEscrowSessions.id, id));
  return row ? rowToSession(row) : undefined;
}

export async function recordMicropayment(
  escrowId: string,
  perCallAmount: number
): Promise<MicropaymentRecord> {
  // Try to increment existing record (1 per escrowId due to unique index).
  const [updated] = await db
    .update(atoaMicropayments)
    .set({
      callCount: sql`${atoaMicropayments.callCount} + 1`,
      totalBilled: sql`${atoaMicropayments.totalBilled} + ${perCallAmount}`,
    })
    .where(eq(atoaMicropayments.escrowId, escrowId))
    .returning();
  if (updated) return rowToMicropay(updated);

  // First call for this escrow — insert.
  const [escrow] = await db.select().from(atoaEscrowSessions).where(eq(atoaEscrowSessions.id, escrowId));
  const id = `pay_${Date.now()}_${(++payCounter).toString().padStart(4, "0")}`;
  const [row] = await db
    .insert(atoaMicropayments)
    .values({
      id,
      escrowId,
      agentId: escrow?.agentId ?? "unknown",
      perCallAmount,
      callCount: 1,
      totalBilled: perCallAmount,
      status: "pending",
    })
    .returning();
  return rowToMicropay(row);
}

export async function settleMicropayment(id: string): Promise<MicropaymentRecord> {
  const [row] = await db
    .update(atoaMicropayments)
    .set({ status: "settled" })
    .where(eq(atoaMicropayments.id, id))
    .returning();
  if (!row) throw new Error(`GUILD-E404: Micropayment record ${id} not found`);
  return rowToMicropay(row);
}

export async function getMicropaymentTotal(agentId: string): Promise<number> {
  const rows = await db
    .select({ totalBilled: atoaMicropayments.totalBilled })
    .from(atoaMicropayments)
    .where(and(eq(atoaMicropayments.agentId, agentId), eq(atoaMicropayments.status, "settled")));
  return rows.reduce((sum, r) => sum + r.totalBilled, 0);
}

// Test-only. Wipes ALL atoa escrow + micropayment rows.
export async function _resetStores(): Promise<void> {
  await db.delete(atoaMicropayments);
  await db.delete(atoaEscrowSessions);
  escrowCounter = 0;
  payCounter = 0;
}
