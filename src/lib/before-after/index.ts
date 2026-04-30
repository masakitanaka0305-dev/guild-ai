import type { Rank } from "@/types";

export type BeforeAfterTemplate = "DataClean" | "Automate" | "UIPolish" | "Speed" | "Insight";

export interface BeforeAfterSpec {
  template: BeforeAfterTemplate;
  beforeLabel: string;
  afterLabel: string;
  primaryColor: string;
  secondaryColor: string;
  rank: Rank;
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const TEMPLATES: BeforeAfterTemplate[] = ["DataClean", "Automate", "UIPolish", "Speed", "Insight"];

const TEMPLATE_COPY: Record<BeforeAfterTemplate, { before: string; after: string }> = {
  DataClean:  { before: "バラバラなデータ", after: "整理されたデータ" },
  Automate:   { before: "手作業で消耗", after: "全自動で解決" },
  UIPolish:   { before: "使いにくいUI", after: "直感的なUI" },
  Speed:      { before: "遅い処理", after: "爆速処理" },
  Insight:    { before: "気づかない課題", after: "すぐわかる洞察" },
};

const RANK_COLORS: Record<Rank, { primary: string; secondary: string }> = {
  S: { primary: "#1A6BB5", secondary: "#0FA968" },
  A: { primary: "#6B6BB5", secondary: "#B56B1A" },
  B: { primary: "#B51A6B", secondary: "#6BB51A" },
  D: { primary: "#9CA3AF", secondary: "#6B7280" },
};

export function generateBeforeAfterSpec(assetId: string, rank: Rank): BeforeAfterSpec {
  const seed = djb2(assetId);
  const template = TEMPLATES[seed % TEMPLATES.length];
  const copy = TEMPLATE_COPY[template];
  const colors = RANK_COLORS[rank];
  return {
    template,
    beforeLabel: copy.before,
    afterLabel: copy.after,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    rank,
  };
}

export function renderBeforeAfterSvg(spec: BeforeAfterSpec, width = 480, height = 320): string {
  const mid = width / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${spec.beforeLabel}から${spec.afterLabel}へ">
  <defs>
    <linearGradient id="ba-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FAFAFA"/>
      <stop offset="100%" stop-color="#F0EEF8"/>
    </linearGradient>
    <linearGradient id="ba-after" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${spec.primaryColor}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${spec.secondaryColor}" stop-opacity="0.25"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#ba-bg)" rx="16"/>
  <!-- Before panel -->
  <rect x="16" y="16" width="${mid - 24}" height="${height - 32}" fill="#1A162808" rx="10" stroke="#1A162820" stroke-width="1"/>
  <text x="${mid / 2}" y="${height / 2 - 12}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#9890A8">Before</text>
  <text x="${mid / 2}" y="${height / 2 + 10}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="600" fill="#4A4464">${spec.beforeLabel}</text>
  <!-- Arrow -->
  <text x="${mid}" y="${height / 2 + 6}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" fill="${spec.primaryColor}">→</text>
  <!-- After panel -->
  <rect x="${mid + 8}" y="16" width="${mid - 24}" height="${height - 32}" fill="url(#ba-after)" rx="10" stroke="${spec.primaryColor}40" stroke-width="1.5"/>
  <text x="${mid + (mid / 2)}" y="${height / 2 - 12}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="${spec.secondaryColor}">After</text>
  <text x="${mid + (mid / 2)}" y="${height / 2 + 10}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="${spec.primaryColor}">${spec.afterLabel}</text>
</svg>`;
}
