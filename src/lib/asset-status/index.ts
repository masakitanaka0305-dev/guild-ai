import type { PortfolioAsset } from "@/lib/portfolio";

export type AssetStatusCode = "ready" | "executing" | "awaiting_update";

export interface AssetStatusInfo {
  code: AssetStatusCode;
  label: string;
  description: string;
}

export const STATUS_META: Record<AssetStatusCode, AssetStatusInfo> = {
  ready: {
    code: "ready",
    label: "待機中",
    description: "API からの呼び出しを待っています。いつでも実行できる状態です。",
  },
  executing: {
    code: "executing",
    label: "実行中",
    description: "現在 AI エージェントからリクエストを受けて処理中です。",
  },
  awaiting_update: {
    code: "awaiting_update",
    label: "要メンテナンス",
    description: "長期間呼び出しがないか、停止中のため内容を見直してください。",
  },
};

/** Boundary: awaiting_update if paused or 30+ days silent */
const AWAITING_MS  = 30 * 24 * 60 * 60_000;
/** Boundary: executing if called within last 30 s */
const EXECUTING_MS = 30_000;

export function computeStatus(
  asset: PortfolioAsset,
  nowMs: number = Date.now(),
): AssetStatusCode {
  if (asset.status === "paused") return "awaiting_update";
  const diffMs = nowMs - new Date(asset.lastCalledAt).getTime();
  if (diffMs > AWAITING_MS)  return "awaiting_update";
  if (diffMs < EXECUTING_MS) return "executing";
  return "ready";
}

export function statusSortOrder(code: AssetStatusCode): number {
  return code === "executing" ? 0 : code === "ready" ? 1 : 2;
}
