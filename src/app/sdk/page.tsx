"use client";

import { useState } from "react";
import Link from "next/link";
import { runComposite, PIPELINE_STEPS, type StepResult } from "@/lib/composite";

const DEMO_IDS = [
  "GUILD:0001-INVOICE",
  "GUILD:0007-NORMALIZE",
  "GUILD:0011-SUMMARY",
];

const SAMPLE_CODE = `import { compose } from "@guild/sdk";

const pipe = compose([
  "GUILD:0001-INVOICE",
  "GUILD:0007-NORMALIZE",
  "GUILD:0011-SUMMARY",
]);

const result = await pipe.run({ pdf: <File> });`;

// ─── Pipeline modal ───────────────────────────────────────────────────────────

function PipelineModal({ onClose }: { onClose: () => void }) {
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<StepResult[]>([]);
  const [output, setOutput] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(-1);

  const handleRun = async () => {
    setRunning(true);
    setSteps([]);
    setOutput(null);

    // Simulate 5-step pipeline with delays
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise((r) => setTimeout(r, 500 + i * 200));
      setSteps((prev) => [
        ...prev,
        {
          step: i,
          label: PIPELINE_STEPS[i],
          status: i < PIPELINE_STEPS.length - 1 ? "running" : "done",
          partial: ["ドキュメントを解析中…","知識グラフを構築中…","クロスリファレンスを確認中…","出力を最適化中…","パイプライン完了。"][i],
        },
      ]);
    }

    const result = runComposite(DEMO_IDS, { pdf: "demo.pdf" });
    setOutput(result.output);
    setRunning(false);
    setCurrentStep(-1);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="パイプライン擬似実行"
    >
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--n-divider,rgba(0,0,0,0.08))] flex items-center justify-between">
          <p className="font-bold text-[var(--n-text,#1A1714)]">パイプライン 擬似実行</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="text-[var(--n-muted,#6B6456)] hover:text-[var(--n-text,#1A1714)] text-lg"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-1.5 mb-4">
            {DEMO_IDS.map((id, i) => (
              <div key={id} className="flex items-center gap-2 text-xs text-[var(--n-muted,#6B6456)]">
                <span className="w-5 h-5 rounded-full bg-[var(--n-surface-2,#F5F3EE)] flex items-center justify-center font-bold text-[10px]">{i+1}</span>
                <code className="font-mono">{id}</code>
              </div>
            ))}
          </div>

          {/* Steps */}
          <ol className="space-y-2 mb-4">
            {PIPELINE_STEPS.map((label, i) => {
              const done = steps.some((s) => s.step === i);
              const active = currentStep === i;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                      done
                        ? "bg-[var(--n-positive,#0E9F4F)] text-white"
                        : active
                        ? "bg-[var(--n-primary,#E64545)] text-white animate-pulse"
                        : "bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-muted,#6B6456)]"
                    }`}
                    aria-label={done ? `${label} 完了` : label}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={`text-xs ${done || active ? "text-[var(--n-text,#1A1714)] font-semibold" : "text-[var(--n-muted,#6B6456)]"}`}>
                    {label}
                    {active && <span className="ml-1 text-[var(--n-muted,#6B6456)]">{steps[steps.length - 1]?.partial ?? ""}</span>}
                  </span>
                </li>
              );
            })}
          </ol>

          {output && (
            <div className="bg-[var(--n-surface-2,#F5F3EE)] rounded-xl px-4 py-3 mb-4">
              <p className="text-[11px] text-[var(--n-muted,#6B6456)] mb-1 font-semibold uppercase tracking-widest">出力</p>
              <p className="text-xs text-[var(--n-text,#1A1714)] leading-relaxed whitespace-pre-wrap">{output}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className="w-full h-12 rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {running ? "実行中…" : output ? "再実行" : "今すぐ試す"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SdkPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <main className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto py-8 pb-24 sm:pb-12">
      <h1 className="sr-only">Composite Intelligence SDK</h1>

      <Link href="/" className="text-xs text-[var(--n-muted,#6B6456)] hover:underline mb-4 inline-block">
        ← ホームに戻る
      </Link>

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-6 rounded-full bg-[var(--n-primary,#E64545)]" />
          <h2 className="text-2xl font-extrabold text-[var(--n-text,#1A1714)]">パイプライン SDK</h2>
        </div>
        <p className="text-sm text-[var(--n-muted,#6B6456)] leading-relaxed mb-1">
          複数のノートを<span className="text-[var(--n-text,#1A1714)] font-semibold">直列・並列</span>につないで、
          ひとつの大きな<span className="text-[var(--n-primary,#E64545)] font-semibold">知能の集合体</span>として動作させる開発キット。
        </p>
        <p className="text-xs text-[var(--n-muted,#6B6456)]">現在プレビュー版 — モック実装です。</p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[
          { icon: "🔗", label: "直列パイプライン", desc: "ノードが順番に処理を受け渡す" },
          { icon: "⚡", label: "並列実行", desc: "複数ノードを同時に走らせる" },
          { icon: "💰", label: "報酬自動分配", desc: "各ノード作成者に自動で報酬" },
        ].map((f) => (
          <div key={f.label} className="bg-[var(--n-surface,#FFFFFF)] border border-[var(--n-divider,rgba(0,0,0,0.08))] rounded-2xl p-4 shadow-sm">
            <span className="text-2xl" role="img" aria-label={f.label}>{f.icon}</span>
            <p className="text-xs font-bold text-[var(--n-text,#1A1714)] mt-2 mb-1">{f.label}</p>
            <p className="text-[10px] text-[var(--n-muted,#6B6456)]">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Code sample */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-[var(--n-primary,#E64545)]" />
          <p className="text-sm font-bold text-[var(--n-text,#1A1714)]">サンプルコード</p>
        </div>
        <div className="overflow-x-auto rounded-2xl bg-[#1A1714]">
          <pre className="px-5 py-4 text-xs font-mono text-[#4DD08F] leading-relaxed whitespace-pre">
            <code>{SAMPLE_CODE}</code>
          </pre>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full h-12 rounded-full bg-[var(--n-primary,#E64545)] text-white font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
      >
        今すぐ試す
      </button>

      {/* Pipeline steps legend */}
      <div className="mt-6 bg-[var(--n-surface-2,#F5F3EE)] rounded-2xl px-5 py-4">
        <p className="text-[10px] font-semibold text-[var(--n-muted,#6B6456)] uppercase tracking-widest mb-3">実行ステップ</p>
        <ol className="flex flex-wrap gap-2">
          {PIPELINE_STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-1.5 text-xs text-[var(--n-text,#1A1714)]">
              <span className="w-4 h-4 rounded-full bg-[var(--n-primary,#E64545)] text-white text-[9px] flex items-center justify-center font-bold">{i+1}</span>
              {step}
              {i < PIPELINE_STEPS.length - 1 && <span className="text-[var(--n-muted,#6B6456)] ml-1">→</span>}
            </li>
          ))}
        </ol>
      </div>

      {showModal && <PipelineModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
