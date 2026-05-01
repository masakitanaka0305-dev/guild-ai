// Dynamic OGP for /asset/[id] and /projects/[id]
// GET /og/asset/:id → 1200×630 image (next/og ImageResponse)

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  function djb2(s: string) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
    return h;
  }
  const seed = djb2(id);
  const ranks = ["S", "A", "A", "B"] as const;
  const rank = ranks[seed % ranks.length];
  const rankColor = rank === "S" ? "#D4AF37" : rank === "A" ? "#4C1D95" : "#6B6456";
  const monthlyMin = 1200 + (seed % 28800);
  const monthlyMax = monthlyMin + 3600 + (seed % 7200);

  const SAMPLE_TITLES = [
    "Next.js SSR パフォーマンス最適化ガイド",
    "Rust + WebAssembly 実装チートシート",
    "TypeScript 型設計パターン集",
    "Kubernetes コスト削減 実践録",
    "LLM プロンプトエンジニアリング",
  ];
  const title = SAMPLE_TITLES[seed % SAMPLE_TITLES.length];

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          background: "linear-gradient(135deg, #FAFAF7 0%, #F0EDE8 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* GUILD AI branding */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "60px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#4C1D95",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 900,
              fontSize: "16px",
            }}
          >
            G
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#1A1714" }}>GUILD AI · Asset</span>
        </div>

        {/* Rank badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "28px",
              background: rankColor,
              color: "white",
              fontSize: "24px",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {rank}
          </div>
          <span style={{ fontSize: "20px", color: rankColor, fontWeight: 700 }}>{rank} ランク</span>
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: "44px",
            fontWeight: 900,
            color: "#1A1714",
            margin: "0 0 32px",
            lineHeight: 1.2,
            maxWidth: "900px",
          }}
        >
          {title}
        </p>

        {/* Monthly revenue */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              background: "#4C1D95",
              borderRadius: "12px",
              padding: "12px 24px",
              color: "white",
              fontWeight: 900,
              fontSize: "22px",
            }}
          >
            月収 ¥{monthlyMin.toLocaleString("ja-JP")} 〜 ¥{monthlyMax.toLocaleString("ja-JP")}
          </div>
          <span style={{ color: "#6B6456", fontSize: "16px" }}>AI エージェント向け</span>
        </div>

        <p
          style={{
            position: "absolute",
            bottom: "40px",
            right: "60px",
            fontSize: "14px",
            color: "#6B6456",
            margin: 0,
          }}
        >
          guild-ai.vercel.app/asset/{id}
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
