// Composite Intelligence SDK — mock implementation (no external calls)
// UI label: パイプライン SDK

export type StepStatus = "pending" | "connecting" | "loading" | "running" | "composing" | "done" | "error";

export const PIPELINE_STEPS: readonly string[] = [
  "Connecting",
  "Loading",
  "Running",
  "Composing",
  "Done",
];

export interface CompositeHandle {
  ids: string[];
  run(payload: Record<string, unknown>): AsyncGenerator<StepResult>;
}

export interface StepResult {
  step: number;
  label: string;
  status: StepStatus;
  partial?: string;
  durationMs?: number;
}

export interface CompositeResult {
  output: string;
  steps: StepResult[];
  totalMs: number;
  nodeCount: number;
}

// ─── Deterministic mock ───────────────────────────────────────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

const PARTIAL_OUTPUTS = [
  "ドキュメントを解析中…",
  "知識グラフを構築中…",
  "クロスリファレンスを確認中…",
  "出力を最適化中…",
  "パイプライン完了。",
];

export function compose(ids: string[]): CompositeHandle {
  return {
    ids,
    run: (payload: Record<string, unknown>) => runCompositeGenerator(ids, payload),
  };
}

async function* runCompositeGenerator(
  ids: string[],
  payload: Record<string, unknown>,
): AsyncGenerator<StepResult> {
  const seed = djb2(ids.join("+") + JSON.stringify(payload));
  const startMs = Date.now();

  for (let i = 0; i < PIPELINE_STEPS.length; i++) {
    const label = PIPELINE_STEPS[i];
    const durationMs = 300 + ((seed * (i + 1) * 1664525) >>> 0) % 400;
    yield {
      step: i,
      label,
      status: i < PIPELINE_STEPS.length - 1 ? "running" : "done",
      partial: PARTIAL_OUTPUTS[i],
      durationMs,
    };
    // Simulate async work (in tests, this resolves immediately)
    await new Promise((r) => setTimeout(r, 0));
  }

  const total = Date.now() - startMs;
  void total; // used in caller
}

export function runComposite(ids: string[], payload: Record<string, unknown>): CompositeResult {
  const seed = djb2(ids.join("+"));
  const steps: StepResult[] = PIPELINE_STEPS.map((label, i) => ({
    step: i,
    label,
    status: i < PIPELINE_STEPS.length - 1 ? ("running" as StepStatus) : ("done" as StepStatus),
    partial: PARTIAL_OUTPUTS[i],
    durationMs: 300 + ((seed * (i + 1) * 1664525) >>> 0) % 400,
  }));

  const outputSeed = djb2(ids.join("") + "output");
  const output = `処理完了：${ids.length} ノードのパイプラインが正常終了しました。\n推定精度スコア: ${70 + (outputSeed % 28)}/100\nノード数: ${ids.length}`;

  return {
    output,
    steps,
    totalMs: steps.reduce((s, st) => s + (st.durationMs ?? 0), 0),
    nodeCount: ids.length,
  };
}

// For use in chain-notify integration
export function getCompositeNodeTitles(ids: string[]): string[] {
  return ids.map((id) => {
    const idx = djb2(id) % 5;
    const TITLES = ["請求書自動化", "データ正規化", "サマリ生成", "分類エンジン", "品質チェック"];
    return TITLES[idx];
  });
}
