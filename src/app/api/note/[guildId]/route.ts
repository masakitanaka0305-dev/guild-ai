import { NextRequest, NextResponse } from "next/server";
import { getEndpointStats, recordCall } from "@/lib/note-endpoint";
import { translateForAgent } from "@/lib/translator";
import { filterGetResponse } from "@/lib/blackbox";

export async function GET(
  _req: NextRequest,
  { params }: { params: { guildId: string } },
) {
  const stats = getEndpointStats(params.guildId);

  // Add translation for AI agents
  const mockMdContent = `${stats.title} — エンドポイント統計。処理件数 ${stats.callsTotal24h}。ランク ${stats.rank}。自動化対応。データ管理・分析・実行。`;
  const translation = translateForAgent(mockMdContent, { title: stats.title, guildId: params.guildId });

  // Apply blackbox visibility filter
  const filtered = filterGetResponse(params.guildId, {
    ...stats,
    translation: {
      english: translation.english,
      schema: translation.schema,
      summary60w: translation.summary60w,
    },
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
