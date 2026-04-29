"use server";

// GUILD AI — Checkout Server Action
// Bridges the "use client" CheckoutSection to server-only DB code.
// Without this layer, importing lib/checkout (and its db/client dep) into a
// client component would bundle Neon for the browser and throw at runtime.

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { createCheckoutSession, confirmPayment } from "@/lib/checkout";
import { issueApiKeyVerified } from "@/lib/api-gateway";
import { purchase } from "@/lib/ownership";
import { db } from "@/db/client";
import { listings } from "@/db/schema";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import type { PaymentMethod, Currency } from "@/types";

export interface PurchaseInput {
  assetId: string;
  amountJpy: number;
  method: PaymentMethod;
  payoutCurrency: Currency;
}

export type PurchaseResult =
  | { status: "settled"; apiKey: string; receiptUrl?: string; txHash?: string }
  | { status: "failed"; message: string };

export async function purchaseAction(input: PurchaseInput): Promise<PurchaseResult> {
  try {
    // Resolve buyer from session cookie. Logged-out visitors get the seeded
    // "demo-user" identity so the demo flow keeps working without registration.
    const token = cookies().get(SESSION_COOKIE_NAME)?.value;
    const sessionUser = await getUserBySessionToken(token);
    const buyerId = sessionUser?.id ?? "demo-user";

    const session = await createCheckoutSession({
      assetId: input.assetId,
      buyerId,
      amountJpy: input.amountJpy,
      method: input.method,
      payoutCurrency: input.payoutCurrency,
    });
    const result = await confirmPayment(session.id);
    if (result.status !== "settled") {
      return { status: "failed", message: "決済に失敗しました。再度お試しください。" };
    }
    const apiKey = await issueApiKeyVerified(buyerId, input.assetId, session.id);

    // Record ownership transfer. Failure is logged but does not fail the purchase
    // — payment and API key are already done; rolling them back isn't possible here.
    try {
      const [listing] = await db
        .select({ title: listings.title })
        .from(listings)
        .where(eq(listings.id, input.assetId));
      await purchase(input.assetId, buyerId, listing?.title ?? input.assetId);
    } catch (err) {
      console.error("[purchaseAction] failed to record ownership:", err);
    }

    return {
      status: "settled",
      apiKey: apiKey.key,
      receiptUrl: result.receiptUrl,
      txHash: result.txHash,
    };
  } catch (err) {
    return {
      status: "failed",
      message: err instanceof Error ? err.message : "エラーが発生しました",
    };
  }
}
