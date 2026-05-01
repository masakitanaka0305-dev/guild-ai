import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  demoKnowledgeGraph,
  linkStrokeWidth,
  linkDistanceMultiplier,
  MAP_NODE_COLOR,
} from "@/lib/knowledge-map";

const ROOT = process.cwd();

describe("Knowledge Map (#130) — graph + helpers", () => {
  it("demo graph centers the user and exposes 3 outer node kinds", () => {
    const g = demoKnowledgeGraph("you");
    const self = g.nodes.filter((n) => n.type === "self");
    expect(self).toHaveLength(1);
    expect(self[0].id).toBe("you");
    expect(g.nodes.filter((n) => n.type === "md").length).toBeGreaterThanOrEqual(3);
    expect(g.nodes.filter((n) => n.type === "project").length).toBeGreaterThanOrEqual(2);
    expect(g.nodes.filter((n) => n.type === "atoa").length).toBeGreaterThanOrEqual(2);
    // Color tokens cover all four node types using brand-aligned hexes.
    expect(MAP_NODE_COLOR.md).toBe("#4C1D95");
    expect(MAP_NODE_COLOR.project).toBe("#8B5CF6");
    expect(MAP_NODE_COLOR.atoa).toBe("#F59E0B");
  });

  it("link helpers normalise stroke width and distance multiplier", () => {
    const g = demoKnowledgeGraph();
    const widths = g.links.map((l) => linkStrokeWidth(g, l.calls));
    for (const w of widths) {
      expect(w).toBeGreaterThanOrEqual(1);
      expect(w).toBeLessThanOrEqual(6);
    }
    expect(linkDistanceMultiplier(0)).toBeLessThan(1);    // recent → tight
    expect(linkDistanceMultiplier(30)).toBeGreaterThan(1); // old → looser
  });
});

describe("KnowledgeMap component — pin self + a11y", () => {
  const km = readFileSync(
    join(ROOT, "src/components/map/KnowledgeMap.tsx"),
    "utf-8",
  );
  const page = readFileSync(
    join(ROOT, "src/app/profile/map/page.tsx"),
    "utf-8",
  );

  it("self node is force-anchored at center via fx/fy", () => {
    expect(km).toContain('data-testid="knowledge-map"');
    expect(km).toMatch(/data-self=\{isSelf \? "true" : "false"\}/);
    expect(km).toMatch(/fx:\s*n\.id === selfId \? cx : undefined/);
    expect(km).toMatch(/fy:\s*n\.id === selfId \? cy : undefined/);
    // Reduced-motion path skips the simulation.
    expect(km).toContain("usePrefersReducedMotion");
    expect(km).toContain("staticLayout");
  });

  it("nodes are tab-reachable + Enter triggers focus state (a11y contract)", () => {
    expect(km).toContain('tabIndex={0}');
    expect(km).toMatch(/role="button"/);
    expect(km).toMatch(/role="img"/);
    expect(km).toContain('aria-label="知恵の地図');
    expect(km).toMatch(/if \(e\.key === "Enter" \|\| e\.key === " "\)/);
  });

  it("/profile/map page mounts the map + legend + back link", () => {
    expect(page).toContain('data-testid="knowledge-map-page"');
    expect(page).toContain("KnowledgeMap");
    expect(page).toContain('data-testid="knowledge-map-legend"');
    expect(page).toContain("プロフィールに戻る");
  });
});
