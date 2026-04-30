import { NextRequest, NextResponse } from "next/server";

// In-memory store for applications
const applications: Application[] = [];

export interface Application {
  id: string;
  projectId: string;
  projectTitle: string;
  mdGuildId: string;
  status: "受付" | "AI鑑定中" | "クライアント確認中";
  appliedAt: string;
}

// Note: getApplications is for internal use only — not exported as a route handler
function getApplications(): Application[] { return applications; }

export async function POST(req: NextRequest) {
  const { projectId, mdGuildId } = await req.json();
  if (!projectId || !mdGuildId) {
    return NextResponse.json({ error: "projectId and mdGuildId required" }, { status: 400 });
  }
  const app: Application = {
    id: `app_${Date.now()}`,
    projectId,
    projectTitle: projectId, // simplified
    mdGuildId,
    status: "受付",
    appliedAt: new Date().toISOString(),
  };
  applications.push(app);
  return NextResponse.json({ ok: true, application: app });
}
