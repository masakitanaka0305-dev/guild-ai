import { NextRequest, NextResponse } from "next/server";
import { getEndpointStats, recordCall } from "@/lib/note-endpoint";
import { translateForAgent } from "@/lib/translator";
import { filterGetResponse } from "@/lib/blackbox";
import { isLikelyCrawler } from "@/lib/encapsulated";
import { signOrigin, originSummary } from "@/lib/origin-registry";

export async function GET(
  req: NextRequest,
  { params }: { params: { guildId: string } },
) {
  // Block known AI crawlers
  const ua = req.headers.get("user-agent") ?? "";
  if (isLikelyCrawler(ua)) {
    return NextResponse.json(
      { error: "GUILD-E403: Crawler access denied. Use POST execution endpoint." },
      { status: 403 },
    );
  }

  const { guildId } = params;
  const stats = getEndpointStats(guildId);

  // Auto-sign origin for this guildId
  signOrigin(guildId, { title: stats.title, rank: stats.rank });

  // Add translation for AI agents
  const mockMdContent = `${stats.title} — エンドポイント統計。処理件数 ${stats.callsTotal24h}。ランク ${stats.rank}。自動化対応。データ管理・分析・実行。`;
  const translation = translateForAgent(mockMdContent, { title: stats.title, guildId });

  // Apply blackbox/encapsulated visibility filter
  const filtered = filterGetResponse(guildId, {
    ...stats,
    translation: {
      english: translation.english,
      schema: translation.schema,
      summary60w: translation.summary60w,
    },
    origin: originSummary(guildId),
  });

  return NextResponse.json(filtered, {
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
