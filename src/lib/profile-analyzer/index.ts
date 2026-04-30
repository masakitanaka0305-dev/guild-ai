// GUILD AI — Engineer Profile Auto-Analyzer
// Fetches a user's top GitHub repos, extracts primary skills from manifest files,
// computes a rank from GitHub stats, and writes the result to the profiles table.
//
// "Deterministic AI" summary: a template-based catchcopy generator. No external
// LLM call — formula is `[lang]を用いた[domain]の開発に強い、経験[N]年相当のエンジニア`.
//
// MVP scope:
//   - Manifest scan only (package.json / requirements.txt / pyproject.toml).
//     Code-level import scanning is post-MVP (heavy).
//   - Top-3 repos selected by `pinned > stars > pushed_at`. We fetch up to 30 repos
//     and pick the top 3.
//   - Rank thresholds derived from stars + contributions + activeYears (Q4 = (B)
//     direct stat threshold, NOT the v1-v4 audit engine).

import { Octokit } from "@octokit/rest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";

// profiles.rank only stores S/A/B (D is not a hire-ready rank for engineers).
export type EngineerRank = "S" | "A" | "B";

export interface ProfileAnalyzerInput {
  userId: string;
  githubLogin: string;
  accessToken: string;
}

export interface GithubStats {
  stars: number;
  contributions: number;
  activeYears: number;
  publicRepos: number;
  pinnedRepoNames: string[];
}

export interface AnalyzerResult {
  primarySkills: string[];
  githubStats: GithubStats;
  rank: EngineerRank;
  aiGeneratedSummary: string;
  lastActiveAt: Date | null;
}

// ─── Manifest detectors ────────────────────────────────────────────────────────

const MANIFEST_FILES = ["package.json", "requirements.txt", "pyproject.toml"] as const;

interface DependencyHit {
  name: string;
  source: "npm" | "pypi";
}

function parsePackageJson(content: string): DependencyHit[] {
  try {
    const json = JSON.parse(content);
    const out: DependencyHit[] = [];
    for (const block of ["dependencies", "devDependencies", "peerDependencies"] as const) {
      const deps = json[block];
      if (deps && typeof deps === "object") {
        for (const name of Object.keys(deps)) out.push({ name, source: "npm" });
      }
    }
    return out;
  } catch {
    return [];
  }
}

function parseRequirementsTxt(content: string): DependencyHit[] {
  const out: DependencyHit[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    // strip extras and version pins: pkg[extra]==1.0.0 → pkg
    const match = /^([A-Za-z0-9_.\-]+)/.exec(line);
    if (match) out.push({ name: match[1], source: "pypi" });
  }
  return out;
}

function parsePyprojectToml(content: string): DependencyHit[] {
  // Lightweight scan — extract package names from PEP 621 / poetry blocks.
  // We don't need a full TOML parser; we just want to know which libs are mentioned.
  const out: DependencyHit[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    // poetry: pkg = "1.0.0"  /  PEP 621: "pkg>=1.0"
    const m1 = /^([A-Za-z0-9_.\-]+)\s*=\s*["']/.exec(line);
    if (m1 && m1[1] !== "python" && m1[1] !== "name" && m1[1] !== "version") {
      out.push({ name: m1[1], source: "pypi" });
      continue;
    }
    const m2 = /^["']([A-Za-z0-9_.\-]+)\s*[<>=!]/.exec(line);
    if (m2) out.push({ name: m2[1], source: "pypi" });
  }
  return out;
}

function parseManifest(filename: string, content: string): DependencyHit[] {
  if (filename === "package.json") return parsePackageJson(content);
  if (filename === "requirements.txt") return parseRequirementsTxt(content);
  if (filename === "pyproject.toml") return parsePyprojectToml(content);
  return [];
}

// ─── Skill normalization ───────────────────────────────────────────────────────
// Map raw dependency names to user-facing skill labels. Multiple deps may
// collapse into one label (e.g. langchain + langchain-core → "LangChain").

const SKILL_RULES: Array<{ label: string; matches: RegExp }> = [
  { label: "Next.js",        matches: /^next$/ },
  { label: "React",          matches: /^react$|^react-dom$/ },
  { label: "TypeScript",     matches: /^typescript$/ },
  { label: "Tailwind CSS",   matches: /^tailwindcss$/ },
  { label: "Vue",            matches: /^vue$/ },
  { label: "Svelte",         matches: /^svelte$/ },
  { label: "FastAPI",        matches: /^fastapi$/ },
  { label: "Django",         matches: /^django$/ },
  { label: "Flask",          matches: /^flask$/ },
  { label: "LangChain",      matches: /^langchain/ },
  { label: "OpenAI SDK",     matches: /^openai$|^@?openai\// },
  { label: "Anthropic SDK",  matches: /^anthropic$|^@?anthropic-ai\// },
  { label: "PyTorch",        matches: /^torch$/ },
  { label: "TensorFlow",     matches: /^tensorflow$/ },
  { label: "scikit-learn",   matches: /^scikit-learn$|^sklearn$/ },
  { label: "Pandas",         matches: /^pandas$/ },
  { label: "NumPy",          matches: /^numpy$/ },
  { label: "Stable Diffusion", matches: /^diffusers$/ },
  { label: "Hugging Face",   matches: /^transformers$|^huggingface_hub$/ },
  { label: "Drizzle ORM",    matches: /^drizzle-orm$/ },
  { label: "Prisma",         matches: /^prisma$|^@prisma\// },
  { label: "GraphQL",        matches: /^graphql$|^@apollo\// },
  { label: "Vitest",         matches: /^vitest$/ },
  { label: "Jest",           matches: /^jest$/ },
];

function mapToSkill(dep: DependencyHit): string | null {
  for (const rule of SKILL_RULES) {
    if (rule.matches.test(dep.name)) return rule.label;
  }
  return null;
}

// ─── Top-N selector ────────────────────────────────────────────────────────────

function pickTopSkills(allDeps: DependencyHit[], n = 3): string[] {
  const counts = new Map<string, number>();
  for (const dep of allDeps) {
    const skill = mapToSkill(dep);
    if (skill) counts.set(skill, (counts.get(skill) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([skill]) => skill);
}

// ─── Rank thresholds (Q4 = direct stat threshold) ──────────────────────────────
// Score = stars * 1.0 + contributions * 0.05 + activeYears * 10
//   S: ≥ 200    A: ≥ 80    B: < 80

export function computeRank(stats: GithubStats): EngineerRank {
  const score = stats.stars * 1.0 + stats.contributions * 0.05 + stats.activeYears * 10;
  if (score >= 200) return "S";
  if (score >= 80)  return "A";
  return "B";
}

// ─── Deterministic summary template ────────────────────────────────────────────

function inferDomain(skills: string[]): string {
  const s = skills.join(" ").toLowerCase();
  if (/langchain|openai|anthropic|hugging/i.test(s)) return "LLM/エージェント";
  if (/diffusers|stable diffusion/i.test(s)) return "画像生成";
  if (/pytorch|tensorflow|scikit/i.test(s))  return "機械学習";
  if (/pandas|numpy/i.test(s)) return "データ解析";
  if (/next|react|vue|svelte/i.test(s)) return "Web フロントエンド";
  if (/fastapi|django|flask/i.test(s))  return "Web API";
  return "ソフトウェア";
}

function inferYears(stats: GithubStats): number {
  return Math.max(1, Math.min(20, stats.activeYears));
}

function inferLanguageLabel(skills: string[]): string {
  // Pick the first skill — it's the most-used.
  return skills[0] ?? "汎用言語";
}

export function generateSummary(skills: string[], stats: GithubStats): string {
  const lang = inferLanguageLabel(skills);
  const domain = inferDomain(skills);
  const years = inferYears(stats);
  return `${lang}×${domain} ${years}年相当`; // ~20 chars
}

// ─── Main analyzer ─────────────────────────────────────────────────────────────

export async function runProfileAnalyzer(input: ProfileAnalyzerInput): Promise<AnalyzerResult> {
  const oct = new Octokit({ auth: input.accessToken });

  // 1. Fetch user repos (top 30, sorted by pushed_at).
  const { data: repos } = await oct.repos.listForUser({
    username: input.githubLogin,
    sort: "pushed",
    direction: "desc",
    per_page: 30,
  });

  // 2. Fetch pinned repos via GraphQL — Octokit supports graphql() by default.
  let pinnedNames: string[] = [];
  try {
    const pinnedRes = await oct.graphql<{
      user: { pinnedItems: { nodes: Array<{ name: string } | null> } };
    }>(`query($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: [REPOSITORY]) {
          nodes { ... on Repository { name } }
        }
      }
    }`, { login: input.githubLogin });
    pinnedNames = pinnedRes.user.pinnedItems.nodes
      .filter((n): n is { name: string } => n !== null)
      .map((n) => n.name);
  } catch {
    pinnedNames = [];
  }

  // 3. Sort repos: pinned > stars > pushed_at. Take top 3.
  const sorted = repos.slice().sort((a, b) => {
    const aPinned = pinnedNames.includes(a.name) ? 1 : 0;
    const bPinned = pinnedNames.includes(b.name) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    if ((b.stargazers_count ?? 0) !== (a.stargazers_count ?? 0)) {
      return (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0);
    }
    return new Date(b.pushed_at ?? 0).getTime() - new Date(a.pushed_at ?? 0).getTime();
  });
  const topRepos = sorted.slice(0, 3);

  // 4. Fetch manifest files from each top repo.
  const allDeps: DependencyHit[] = [];
  for (const repo of topRepos) {
    for (const filename of MANIFEST_FILES) {
      try {
        const { data } = await oct.repos.getContent({
          owner: input.githubLogin,
          repo: repo.name,
          path: filename,
        });
        if (!Array.isArray(data) && "content" in data && data.content) {
          const decoded = Buffer.from(data.content, "base64").toString("utf-8");
          allDeps.push(...parseManifest(filename, decoded));
        }
      } catch {
        // 404 or other — skip silently
      }
    }
  }

  const primarySkills = pickTopSkills(allDeps, 3);

  // 5. Aggregate stats.
  const stars = repos.reduce((s, r) => s + (r.stargazers_count ?? 0), 0);
  const earliestRepo = repos.reduce<Date | null>((min, r) => {
    const d = r.created_at ? new Date(r.created_at) : null;
    if (!d) return min;
    return min === null || d < min ? d : min;
  }, null);
  const activeYears = earliestRepo
    ? Math.max(0, Math.floor((Date.now() - earliestRepo.getTime()) / (365 * 24 * 3600 * 1000)))
    : 0;

  // contributions ≈ user public events count (cheap proxy — full graphql needs more cost)
  let contributions = 0;
  try {
    const { data: events } = await oct.activity.listPublicEventsForUser({
      username: input.githubLogin,
      per_page: 100,
    });
    contributions = events.length;
  } catch {
    contributions = 0;
  }

  const lastActiveAt = repos[0]?.pushed_at ? new Date(repos[0].pushed_at) : null;

  const githubStats: GithubStats = {
    stars,
    contributions,
    activeYears,
    publicRepos: repos.length,
    pinnedRepoNames: pinnedNames,
  };

  const rank = computeRank(githubStats);
  const aiGeneratedSummary = generateSummary(primarySkills, githubStats);

  // 6. Persist to DB.
  await db
    .update(profiles)
    .set({
      primarySkills,
      githubStats,
      rank,
      aiGeneratedSummary,
      lastActiveAt,
      status: "official",
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, input.userId));

  return {
    primarySkills,
    githubStats,
    rank,
    aiGeneratedSummary,
    lastActiveAt,
  };
}
