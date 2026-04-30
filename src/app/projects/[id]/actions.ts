"use server";

// GUILD AI — Project Server Actions
// Double validation: (1) zod schema, (2) project requirement cross-check.

import { z } from "zod";
import { getProject, createEscrowReserve, advanceEscrowStatus } from "@/lib/projects";

export type ActionResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

// ─── schemas ─────────────────────────────────────────────────────────────────

const ApplySchema = z.object({
  projectId:       z.string().min(1).max(64).regex(/^proj_[a-z0-9_]+$/),
  applicantHandle: z.string().min(1).max(64),
  mdRentalIds:     z.array(z.string().min(1).max(64)).max(20),
});

const DeliverableSchema = z.object({
  projectId:   z.string().min(1).max(64).regex(/^proj_[a-z0-9_]+$/),
  escrowId:    z.string().min(1).max(64),
  evidenceUrl: z.string().url().startsWith("https://"),
});

const ReleaseSchema = z.object({
  projectId: z.string().min(1).max(64).regex(/^proj_[a-z0-9_]+$/),
  escrowId:  z.string().min(1).max(64),
});

// ─── applyWithRental ─────────────────────────────────────────────────────────

export async function applyWithRental(
  projectId: string,
  applicantHandle: string,
  mdRentalIds: string[],
): Promise<ActionResult> {
  // Validation pass 1: zod schema
  const parsed = ApplySchema.safeParse({ projectId, applicantHandle, mdRentalIds });
  if (!parsed.success) {
    return { ok: false, error: `Validation failed: ${parsed.error.issues[0]?.message}` };
  }

  // Validation pass 2: cross-check rental IDs against project required_md_interfaces
  const project = getProject(projectId);
  if (!project) return { ok: false, error: "Project not found" };

  const validMdIds = new Set(project.requiredMdInterfaces.map((m) => m.id));
  const invalidIds = mdRentalIds.filter((id) => !validMdIds.has(id));
  if (invalidIds.length > 0) {
    return { ok: false, error: `MD IDs not part of this project: ${invalidIds.join(", ")}` };
  }

  // Calculate escrow reserve (rental hours × hourly rate per rented MD)
  const hoursEstimate = 40; // 1 week equivalent
  const totalReservedMilliJpy =
    mdRentalIds.length * project.rentalFeeHourlyJpy * hoursEstimate * 1000;

  const reserve = createEscrowReserve(
    projectId,
    applicantHandle,
    mdRentalIds,
    totalReservedMilliJpy,
  );

  return { ok: true, data: { escrowId: reserve.id, status: reserve.status } };
}

// ─── submitDeliverable ───────────────────────────────────────────────────────

export async function submitDeliverable(
  projectId: string,
  escrowId: string,
  evidenceUrl: string,
): Promise<ActionResult> {
  const parsed = DeliverableSchema.safeParse({ projectId, escrowId, evidenceUrl });
  if (!parsed.success) {
    return { ok: false, error: `Validation failed: ${parsed.error.issues[0]?.message}` };
  }

  const project = getProject(projectId);
  if (!project) return { ok: false, error: "Project not found" };

  const reserve = advanceEscrowStatus(escrowId);
  if (!reserve) return { ok: false, error: "Escrow reserve not found" };

  return { ok: true, data: { escrowId, status: reserve.status, evidenceUrl } };
}

// ─── releaseEscrow ────────────────────────────────────────────────────────────

export async function releaseEscrow(
  projectId: string,
  escrowId: string,
): Promise<ActionResult> {
  const parsed = ReleaseSchema.safeParse({ projectId, escrowId });
  if (!parsed.success) {
    return { ok: false, error: `Validation failed: ${parsed.error.issues[0]?.message}` };
  }

  const reserve = advanceEscrowStatus(escrowId);
  if (!reserve) return { ok: false, error: "Escrow reserve not found" };
  if (reserve.status !== "settled") {
    return { ok: false, error: "Cannot release: deliverable not submitted yet" };
  }

  return { ok: true, data: { escrowId, status: reserve.status } };
}
