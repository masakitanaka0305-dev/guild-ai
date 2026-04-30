import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isMockGithub } from "@/lib/next-auth";
import { getContext } from "@/lib/repo-context";
import { parseIntel, mockIntelDraft } from "@/lib/intel-parser";
import { getMockRepos } from "@/lib/github-picker";

export async function POST(req: NextRequest) {
  const { owner, repo } = await req.json();
  if (!owner || !repo) return NextResponse.json({ error: "missing owner/repo" }, { status: 400 });

  if (isMockGithub) {
    const mockRepos = getMockRepos(owner);
    const mockRepo = mockRepos.find(r => r.name === repo) ?? mockRepos[0];
    const mockCtx = {
      language: mockRepo?.language ?? "TypeScript",
      runtime: "Node.js 18+",
      version: "1.0.0",
      deps: ["react", "next", "typescript", "zod"],
      hasTests: true,
      hasReadme: true,
      hasLicense: true,
    };
    const draft = mockIntelDraft({
      repoName: repo,
      readme: `# ${repo}\n${mockRepo?.description ?? "AI-powered tool"}`,
      commits: ["feat: initial implementation", "fix: edge case handling", "docs: add readme"],
      snippets: [],
      context: mockCtx,
    });
    return NextResponse.json({ context: mockCtx, draft, mock: true });
  }

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const accessToken = (session as any).accessToken as string;
    const ctxResult = await getContext(owner, repo, accessToken);
    const { Octokit } = await import("@octokit/rest");
    const octokit = new Octokit({ auth: accessToken });

    const [commitsResp, readmeResp, contentsResp] = await Promise.allSettled([
      octokit.repos.listCommits({ owner, repo, per_page: 20 }),
      octokit.repos.getReadme({ owner, repo }),
      octokit.repos.getContent({ owner, repo, path: "" }),
    ]);

    const commits = commitsResp.status === "fulfilled"
      ? commitsResp.value.data.map(c => c.commit.message)
      : [];

    let readmeText = "";
    if (readmeResp.status === "fulfilled" && "content" in readmeResp.value.data) {
      readmeText = Buffer.from((readmeResp.value.data as any).content, "base64").toString("utf8");
    }

    const snippets: { path: string; content: string }[] = [];
    if (contentsResp.status === "fulfilled" && Array.isArray(contentsResp.value.data)) {
      const codeFiles = (contentsResp.value.data as any[])
        .filter(f => f.type === "file" && /\.(ts|tsx|js|py|go|rs)$/.test(f.name))
        .slice(0, 5);
      for (const f of codeFiles) {
        try {
          const { data } = await octokit.repos.getContent({ owner, repo, path: f.path });
          if (!Array.isArray(data) && "content" in data) {
            snippets.push({ path: f.path, content: Buffer.from(data.content, "base64").toString("utf8") });
          }
        } catch {}
      }
    }

    const draft = await parseIntel({
      repoName: repo,
      readme: readmeText,
      commits,
      snippets,
      context: ctxResult,
    });

    return NextResponse.json({ context: ctxResult, draft, mock: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
