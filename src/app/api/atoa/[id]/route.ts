import { NextRequest, NextResponse } from "next/server";
import { MOCK_MARKETPLACE } from "@/lib/marketplace";
import { runWithQA } from "@/lib/atoa-runner";
import { generateEmblemSpec, specToVectorEmbedding } from "@/lib/asset-emblem";
import { mintGuildIdForAsset } from "@/lib/guild-id";
import { getLicenseQuote, recordMicropayment, type CallerType } from "@/lib/api-licensing";
import { resolvePrice } from "@/lib/dynamic-pricing";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer gld_")) {
    return NextResponse.json(
      { error: "GUILD-E401: Missing or invalid Authorization header. Expected: Bearer gld_<ACCESS_KEY>" },
      { status: 401 }
    );
  }

  const callerType: CallerType =
    (req.headers.get("X-Caller-Type") as CallerType | null) ?? "agent";

  const callerIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "";
  const callerRegion = req.headers.get("X-Caller-Region") ?? "";

  const agent = MOCK_MARKETPLACE.find((m) => m.listing.id === params.id);
  if (!agent) {
    return NextResponse.json({ error: `GUILD-E404: Agent ${params.id} not found` }, { status: 404 });
  }

  let body: { input?: string; agentId?: string; sessionId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // allow empty body
  }

  const input = typeof body.input === "string" ? body.input : "No input provided";
  const result = await runWithQA(params.id, input);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "GUILD-E502: Agent execution degraded. Refund issued.",
        refundIssued: true,
        instanceId: result.instanceId,
        reason: result.refundReason,
      },
      { status: 502 }
    );
  }

  const licenseQuote = getLicenseQuote(callerType, { floorPrice: agent.listing.floorPrice });
  recordMicropayment(params.id, callerType, licenseQuote.perCallJpyc);

  const pricing = resolvePrice({
    ip: callerIp || callerRegion,
    authToken: authHeader.replace("Bearer ", ""),
    floorPriceJpy: agent.listing.floorPrice,
  });

  const spec = generateEmblemSpec(params.id);
  return NextResponse.json({
    agentId: params.id,
    guildId: mintGuildIdForAsset(params.id),
    instanceId: result.instanceId,
    output: result.output,
    durationMs: result.durationMs,
    billedJpy: agent.listing.floorPrice,
    licenseQuote,
    pricing: {
      currency: pricing.currency,
      perCallNet: pricing.floorPriceLocal,
      multiplier: pricing.multiplier,
      reasoning: pricing.reasoning,
    },
    emblem: {
      vectorEmbedding: specToVectorEmbedding(spec),
      svgUrl: `/api/emblem/${params.id}`,
    },
  });
}
