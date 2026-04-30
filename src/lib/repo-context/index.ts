export interface RepoContext {
  language: string;
  runtime: string;
  version: string;
  deps: string[];
  hasTests: boolean;
  hasReadme: boolean;
  hasLicense: boolean;
}

export interface ManifestFiles {
  packageJson?: string;
  goMod?: string;
  requirementsTxt?: string;
  cargoToml?: string;
  pyprojectToml?: string;
}

export function extractContext(files: ManifestFiles): RepoContext {
  // Parse package.json
  if (files.packageJson) {
    try {
      const pkg = JSON.parse(files.packageJson);
      const allDeps = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
      return {
        language: "TypeScript/JavaScript",
        runtime: `Node.js ${pkg.engines?.node ?? "18+"}`,
        version: pkg.version ?? "0.1.0",
        deps: allDeps.slice(0, 10),
        hasTests: allDeps.some(d => ["jest","vitest","mocha","jasmine"].includes(d)),
        hasReadme: false,
        hasLicense: false,
      };
    } catch {}
  }
  // go.mod
  if (files.goMod) {
    const goMatch = files.goMod.match(/^go\s+([\d.]+)/m);
    const deps = (files.goMod.match(/^\s+([^\s]+)\s+v[\d.]+/gm) ?? []).slice(0,10).map(l => l.trim().split(" ")[0]);
    return {
      language: "Go",
      runtime: `Go ${goMatch?.[1] ?? "1.21+"}`,
      version: "0.1.0",
      deps,
      hasTests: true,
      hasReadme: false,
      hasLicense: false,
    };
  }
  // requirements.txt
  if (files.requirementsTxt) {
    const deps = files.requirementsTxt.split("\n").filter(l => l.trim() && !l.startsWith("#")).slice(0, 10).map(l => l.split("==")[0].split(">=")[0].trim());
    return {
      language: "Python",
      runtime: "Python 3.10+",
      version: "0.1.0",
      deps,
      hasTests: deps.some(d => ["pytest","unittest"].includes(d)),
      hasReadme: false,
      hasLicense: false,
    };
  }
  // Cargo.toml
  if (files.cargoToml) {
    const versionMatch = files.cargoToml.match(/^version\s*=\s*"([^"]+)"/m);
    return {
      language: "Rust",
      runtime: "Rust (stable)",
      version: versionMatch?.[1] ?? "0.1.0",
      deps: [],
      hasTests: true,
      hasReadme: false,
      hasLicense: false,
    };
  }
  return {
    language: "Unknown",
    runtime: "不明",
    version: "0.1.0",
    deps: [],
    hasTests: false,
    hasReadme: false,
    hasLicense: false,
  };
}

// Real octokit-based context fetcher (server-side only)
export async function getContext(owner: string, repo: string, accessToken?: string): Promise<RepoContext & { raw: ManifestFiles }> {
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: accessToken });

  const tryGet = async (path: string): Promise<string | undefined> => {
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      if (!Array.isArray(data) && data.type === "file" && "content" in data) {
        return Buffer.from(data.content, "base64").toString("utf8");
      }
    } catch {}
    return undefined;
  };

  const [packageJson, goMod, requirementsTxt, cargoToml, pyprojectToml, readme, license] = await Promise.all([
    tryGet("package.json"),
    tryGet("go.mod"),
    tryGet("requirements.txt"),
    tryGet("Cargo.toml"),
    tryGet("pyproject.toml"),
    tryGet("README.md").then(r => r ?? tryGet("readme.md")),
    tryGet("LICENSE").then(l => l ?? tryGet("LICENSE.md")),
  ]);

  const raw: ManifestFiles = { packageJson, goMod, requirementsTxt, cargoToml, pyprojectToml };
  const ctx = extractContext(raw);
  ctx.hasReadme = !!readme;
  ctx.hasLicense = !!license;
  return { ...ctx, raw };
}
