import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isMockGithub } from "@/lib/next-auth";
import { Octokit } from "@octokit/rest";
import { getMockRepos } from "@/lib/github-picker";

export async function GET(req: NextRequest) {
  if (isMockGithub) {
    const repos = getMockRepos("demo-user");
    return NextResponse.json({ repos, mock: true });
  }

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const octokit = new Octokit({ auth: (session as any).accessToken });
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated", per_page: 30, affiliation: "owner",
    });
    const repos = data.map(r => ({
      id: String(r.id),
      name: r.name,
      fullName: r.full_name,
      description: r.description ?? "",
      url: r.html_url,
      language: r.language ?? "Unknown",
      stars: r.stargazers_count ?? 0,
      isPrivate: r.private,
      updatedAt: r.updated_at ?? "",
      recommended: (r.stargazers_count ?? 0) > 5,
    }));
    return NextResponse.json({ repos, mock: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
