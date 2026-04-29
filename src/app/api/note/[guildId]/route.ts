import { NextRequest, NextResponse } from "next/server";
import { getEndpointStats, recordCall } from "@/lib/note-endpoint";

export async function GET(
  _req: NextRequest,
  { params }: { params: { guildId: string } },
) {
  const stats = getEndpointStats(params.guildId);
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "public, max-age=30" },
  });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { guildId: string } },
) {
  const result = recordCall(params.guildId);
  return NextResponse.json({ ok: true, ...result });
}
