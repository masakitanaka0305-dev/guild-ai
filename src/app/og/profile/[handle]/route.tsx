// Dynamic OGP for /profile/[handle]
// GET /og/profile/:handle → 1200×630 image (next/og ImageResponse)

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: { handle: string } },
) {
  const { handle } = params;

  // Mock: derive display values deterministically from handle
  function djb2(s: string) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
    return h;
  }
  const seed = djb2(handle);
  const score = 60 + (seed % 35);
  const totalJpy = (50_000 + (seed % 950_000)).toLocaleString("ja-JP");
  const ranks = ["S", "A", "A", "B"] as const;
  const rank = ranks[seed % ranks.length];
  const rankColor = rank === "S" ? "#D4AF37" : rank === "A" ? "#6366F1" : "#6B6456";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #FAFAF7 0%, #F5F3EE 100%)",
          fontFamily: "sans-serif",
          padding: "60px",
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
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "#6366F1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 900,
              fontSize: "18px",
            }}
          >
            G
          </div>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#1A1714" }}>
            GUILD AI
          </span>
        </div>

        {/* Rank badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "40px",
            background: rankColor,
            color: "white",
            fontSize: "36px",
            fontWeight: 900,
            marginBottom: "24px",
          }}
        >
          {rank}
        </div>

        {/* Handle */}
        <p style={{ fontSize: "48px", fontWeight: 900, color: "#1A1714", margin: "0 0 8px" }}>
          @{handle}
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "48px", marginTop: "24px" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#6B6456", margin: "0 0 4px" }}>Validation Score</p>
            <p style={{ fontSize: "36px", fontWeight: 900, color: "#6366F1", margin: 0 }}>{score}</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#6B6456", margin: "0 0 4px" }}>累計報酬</p>
            <p style={{ fontSize: "36px", fontWeight: 900, color: "#D4AF37", margin: 0 }}>¥{totalJpy}</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#6B6456", margin: "0 0 4px" }}>ランク</p>
            <p style={{ fontSize: "36px", fontWeight: 900, color: rankColor, margin: 0 }}>{rank} ランク</p>
          </div>
        </div>

        {/* Bottom tagline */}
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
          guild-ai.vercel.app
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
