import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "../../..");

describe("api/emblem route", () => {
  const src = readFileSync(resolve(root, "src/app/api/emblem/[assetId]/route.ts"), "utf8");

  it("exports GET handler", () => {
    expect(src).toContain("export function GET");
  });

  it("uses image/svg+xml content type", () => {
    expect(src).toContain("image/svg+xml");
  });

  it("calls generateEmblemSpec and renderEmblemSvg", () => {
    expect(src).toContain("generateEmblemSpec");
    expect(src).toContain("renderEmblemSvg");
  });

  it("sets Cache-Control header", () => {
    expect(src).toContain("Cache-Control");
  });
});

describe("api/catalog emblem field", () => {
  const src = readFileSync(resolve(root, "src/app/api/catalog/route.ts"), "utf8");

  it("imports specToVectorEmbedding", () => {
    expect(src).toContain("specToVectorEmbedding");
  });

  it("includes svgUrl in emblem field", () => {
    expect(src).toContain("svgUrl");
    expect(src).toContain("/api/emblem/");
  });

  it("includes vectorEmbedding in emblem field", () => {
    expect(src).toContain("vectorEmbedding");
  });
});

describe("api/atoa/[id] emblem field", () => {
  const src = readFileSync(resolve(root, "src/app/api/atoa/[id]/route.ts"), "utf8");

  it("includes emblem.vectorEmbedding in response", () => {
    expect(src).toContain("vectorEmbedding");
  });

  it("includes emblem.svgUrl in response", () => {
    expect(src).toContain("svgUrl");
  });
});

describe("globals.css nameraka animations", () => {
  const src = readFileSync(resolve(root, "src/app/globals.css"), "utf8");

  it("defines scanLine keyframe animation", () => {
    expect(src).toContain("@keyframes scanLine");
  });

  it("defines slideInToast keyframe animation", () => {
    expect(src).toContain("@keyframes slideInToast");
  });

  it("respects prefers-reduced-motion", () => {
    expect(src).toContain("prefers-reduced-motion");
  });
});

describe("sell page photo upload", () => {
  const src = readFileSync(resolve(root, "src/app/sell/page.tsx"), "utf8");

  it("imports setPhoto from asset-photos", () => {
    expect(src).toContain("setPhoto");
    expect(src).toContain("asset-photos");
  });

  it("has file input accepting images", () => {
    expect(src).toContain('accept="image/*"');
    expect(src).toContain('type="file"');
  });

  it("shows photo preview section with aria-label", () => {
    expect(src).toContain("写真でも見せる");
    expect(src).toContain("aria-label");
  });
});

describe("showcase page nameraka", () => {
  const src = readFileSync(resolve(root, "src/app/showcase/page.tsx"), "utf8");

  it("does not use deprecated THUMB_COLORS gradient fallback", () => {
    expect(src).not.toContain("THUMB_COLORS");
    expect(src).not.toContain("thumbGradient");
  });
});

describe("marketplace page nameraka", () => {
  const src = readFileSync(resolve(root, "src/app/marketplace/page.tsx"), "utf8");

  it("renders product listings", () => {
    expect(src).toContain("MOCK_MARKETPLACE");
  });
});
