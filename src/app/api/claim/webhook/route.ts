import { NextRequest, NextResponse } from "next/server";
import { verifySignedCommit, verifyHiddenFile } from "@/lib/ownership-verify";

export async function POST(req: NextRequest) {
  const isMock = req.headers.get("X-Mock-Verify") === "true";
  if (!isMock) return NextResponse.json({ error: "Not implemented" }, { status: 501 });

  const body = await req.json();
  const { repoUrl, method, payload } = body as {
    repoUrl: string;
    method: "commit" | "file";
    payload: unknown;
  };

  const result = method === "commit"
    ? await verifySignedCommit(repoUrl, payload as { message: string; verified: boolean })
    : await verifyHiddenFile(repoUrl, payload as { path: string; contents: Record<string, unknown> });

  return NextResponse.json(result);
}
