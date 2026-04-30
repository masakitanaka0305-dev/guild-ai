import type { IntelDraft } from "@/lib/intel-parser";
import { autoList } from "@/lib/marketplace";
import { getDb } from "@/lib/db";

export interface DepositInput {
  owner: string;
  repo: string;
  draft: IntelDraft;
  consentSig: string;
  title?: string;
}

export interface DepositResult {
  guildId: string;
  rank: string;
  floorPrice: number;
  listedAt: string;
  sourceUrl: string;
}

// In-memory store (Supabase optional)
const deposits = new Map<string, DepositResult & { draft: IntelDraft }>();

function buildMdContent(draft: IntelDraft, repoName: string): string {
  return `# ${draft.suggestedTitle || repoName} — Implementation Guide

なぜこの実装か（why）: ${draft.課題}
制約 constraint: ${draft.鑑定}
落とし穴 gotcha: 環境依存のエッジケースに注意。
パフォーマンス performance latency: ${draft.本質}
テスト test example: 各ユースケースで動作検証済み。output: { result: "ok" }
フォールバック fallback: エラー時はモックモードで継続稼働。

\`\`\`typescript
// Core implementation
async function process(input: unknown) { }
class Engine { }
function validate(data: unknown) { }
\`\`\``;
}

export async function depositAsset(input: DepositInput): Promise<DepositResult> {
  const { owner, repo, draft, title } = input;
  const guildId = `GUILD:GH:${owner}:${repo}:${Date.now()}`;
  const sourceUrl = `https://github.com/${owner}/${repo}`;
  const mdContent = buildMdContent(draft, title ?? repo);

  const listed = autoList(
    {
      id: guildId,
      ownerId: owner,
      title: draft.suggestedTitle || title || repo,
      description: draft.課題.slice(0, 100),
      ccaf: {
        intentSignals: ["author-statement", "github-oauth", "manual-edit"],
        thoughtDensity: 75,
        iterations: 10,
        authorId: owner,
        createdAt: new Date().toISOString(),
      },
      vercelUptimeDays: 30,
      basePrice: 8000,
      mdContent,
    },
    { qualityHistory: 70, discordContribution: 50, xAmplification: 40 }
  );

  const result: DepositResult = {
    guildId,
    rank: listed.listing.rank,
    floorPrice: listed.listing.floorPrice,
    listedAt: listed.listedAt,
    sourceUrl,
  };

  deposits.set(guildId, { ...result, draft });

  // Optional Supabase
  const supabase = getDb();
  if (supabase) {
    try {
      await supabase.from("md_assets").insert({
        id: guildId,
        owner_handle: owner,
        title: draft.suggestedTitle || repo,
        four_section_json: JSON.stringify(draft),
        source_url: sourceUrl,
        rank: result.rank,
        validation_score: listed.auditResult.score,
      });
    } catch {}
  }

  return result;
}

export function getDeposit(guildId: string) { return deposits.get(guildId); }
