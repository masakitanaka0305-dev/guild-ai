// Repo Scanner — one-click GitHub scan to extract MD assets

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

function lcg(seed: number, i: number): number {
  return ((seed * (i + 1) * 1664525 + 1013904223) >>> 0) % 1000;
}

export interface ScannedFile {
  path: string;
  type: "md" | "code" | "config" | "other";
  sizeKB: number;
  mdScore: number;  // 0–100, relevance for conversion to MD asset
}

export interface SuggestedAsset {
  title: string;
  pathHint: string;
  rank: "S" | "A" | "B";
  suggestedPriceJpy: number;
}

export interface ScanSummary {
  totalFiles: number;
  mdCount: number;
  codeCount: number;
  readmeFound: boolean;
}

export interface ScanResult {
  githubUrl: string;
  files: ScannedFile[];
  suggestedAssets: SuggestedAsset[];
  summary: ScanSummary;
}

// Deterministic file name sets based on seed
const CODE_PATHS = [
  "src/index.ts", "src/utils.ts", "src/main.py", "src/lib.go",
  "lib/core.ts", "lib/utils.py", "cmd/main.go", "app/api.ts",
  "src/server.rs", "src/client.ts",
];

const MD_PATHS = [
  "docs/guide.md", "docs/api.md", "docs/setup.md",
  "CONTRIBUTING.md", "ARCHITECTURE.md", "docs/tutorial.md",
];

function rankFromScore(mdScore: number): "S" | "A" | "B" {
  if (mdScore >= 80) return "S";
  if (mdScore >= 50) return "A";
  return "B";
}

function priceFromRank(rank: "S" | "A" | "B"): number {
  return rank === "S" ? 800 : rank === "A" ? 400 : 150;
}

function titleFromPath(path: string): string {
  const base = path.split("/").pop()?.replace(/\.(md|ts|py|go|rs)$/, "") ?? path;
  return base
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function validateGithubUrl(url: string): boolean {
  return /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/.test(url);
}

export function scanRepo(githubUrl: string): ScanResult {
  const seed = djb2(githubUrl);

  const fileCount = 5 + (seed % 8);  // 5–12 files
  const mdCount = 2 + (seed % 4);    // 2–5 md files
  const codeCount = fileCount - mdCount;

  const files: ScannedFile[] = [];

  // Always include README.md
  files.push({
    path: "README.md",
    type: "md",
    sizeKB: 4 + (lcg(seed, 0) % 20),
    mdScore: 85 + (lcg(seed, 1) % 15),
  });

  // Add more MD files
  for (let i = 0; i < mdCount - 1 && i < MD_PATHS.length; i++) {
    const idx = (seed + i) % MD_PATHS.length;
    files.push({
      path: MD_PATHS[idx],
      type: "md",
      sizeKB: 2 + (lcg(seed, i + 2) % 15),
      mdScore: 40 + (lcg(seed, i + 10) % 55),
    });
  }

  // Add code files (running code signal)
  for (let i = 0; i < codeCount && i < CODE_PATHS.length; i++) {
    const idx = (seed + i * 3) % CODE_PATHS.length;
    files.push({
      path: CODE_PATHS[idx],
      type: "code",
      sizeKB: 5 + (lcg(seed, i + 20) % 40),
      mdScore: 0,
    });
  }

  // Derive suggested assets from MD files
  const suggestedAssets: SuggestedAsset[] = files
    .filter((f) => f.type === "md")
    .map((f) => {
      const rank = rankFromScore(f.mdScore);
      return {
        title: titleFromPath(f.path),
        pathHint: f.path,
        rank,
        suggestedPriceJpy: priceFromRank(rank),
      };
    });

  return {
    githubUrl,
    files,
    suggestedAssets,
    summary: {
      totalFiles: files.length,
      mdCount,
      codeCount,
      readmeFound: true,
    },
  };
}
