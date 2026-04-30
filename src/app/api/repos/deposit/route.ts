import { NextRequest, NextResponse } from "next/server";
import { depositAsset } from "@/lib/asset-deposit";

export async function POST(req: NextRequest) {
  const { owner, repo, draft, consentSig, title } = await req.json();
  if (!consentSig) return NextResponse.json({ error: "consent required" }, { status: 400 });

  const result = await depositAsset({ owner, repo, draft, consentSig, title });
  return NextResponse.json(result);
}
