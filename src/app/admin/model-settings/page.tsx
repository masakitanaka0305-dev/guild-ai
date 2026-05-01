"use client";

import { useState } from "react";
import { Settings, ShieldCheck, MessageSquare, FileJson } from "lucide-react";
import { PipelineStepper } from "@/components/ui/PipelineStepper";

interface SectionProps {
  title: string;
  caption: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FormSection({ title, caption, icon, children }: SectionProps) {
  return (
    <details
      data-testid={`model-settings-section-${title}`}
      data-component="model-settings-section"
      className="group rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] mb-4 overflow-hidden"
      open
    >
      <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 hover:bg-[var(--color-bg-elevated)]">
        <div className="flex items-center gap-3 min-w-0">
          <span aria-hidden className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-ai-action)]/10 text-[var(--color-ai-action)]">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {title}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              {caption}
            </p>
          </div>
        </div>
        <span aria-hidden className="text-[var(--color-text-muted)] group-open:rotate-180 transition-transform">
          ▾
        </span>
      </summary>
      <div className="px-5 pb-5 border-t border-[var(--color-border-subtle)]">
        {children}
      </div>
    </details>
  );
}

function Field({ id, label, hint, children }: {
  id: string; label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <label htmlFor={id} className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}

export default function ModelSettingsPage() {
  const [baseModel, setBaseModel] = useState("claude-3.7-sonnet");
  const [promptStyle, setPromptStyle] = useState("balanced");
  const [maxTokens, setMaxTokens] = useState("4000");
  const [outputFormat, setOutputFormat] = useState("json");
  const [moderation, setModeration] = useState(true);

  return (
    <main className="bg-[var(--color-bg-base)] text-[var(--color-text-primary)] min-h-screen min-h-dvh px-5 sm:px-8 py-8 max-w-3xl mx-auto">
      <header className="mb-6">
        <h1
          data-testid="model-settings-h1"
          className="text-2xl font-bold tracking-tight"
        >
          モデル設定
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          ベースモデル・プロンプト・安全装置・出力形式をひとまとめに設定します。
        </p>
      </header>

      <PipelineStepper
        ariaLabel="モデル運用ステッパー"
        className="mb-8"
        steps={[
          { label: "学習",   hint: "完了",   done: true },
          { label: "評価",   hint: "進行中", active: true },
          { label: "デプロイ", hint: "未着手", todo: true },
        ]}
      />

      <FormSection
        title="1. ベースモデル"
        caption="どの基盤モデルから推論を始めるか"
        icon={<Settings aria-hidden className="w-4 h-4" />}
      >
        <Field id="base-model" label="モデル" hint="運用中のリクエストはこの値で発火します。">
          <select
            id="base-model"
            value={baseModel}
            onChange={(e) => setBaseModel(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] px-3 focus:outline focus:outline-2 focus:outline-[var(--color-ai-action)]"
          >
            <option value="claude-3.7-sonnet">Claude 3.7 Sonnet</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          </select>
        </Field>
      </FormSection>

      <FormSection
        title="2. プロンプト方針"
        caption="出力のトーンと厳密さ"
        icon={<MessageSquare aria-hidden className="w-4 h-4" />}
      >
        <Field id="prompt-style" label="トーン" hint="例：忠実 / バランス / 創造的">
          <select
            id="prompt-style"
            value={promptStyle}
            onChange={(e) => setPromptStyle(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] px-3 focus:outline focus:outline-2 focus:outline-[var(--color-ai-action)]"
          >
            <option value="strict">忠実（決定論的）</option>
            <option value="balanced">バランス</option>
            <option value="creative">創造的</option>
          </select>
        </Field>
      </FormSection>

      <FormSection
        title="3. 安全装置（ガードレール）"
        caption="モデレーション・拒否ポリシー"
        icon={<ShieldCheck aria-hidden className="w-4 h-4" />}
      >
        <Field id="moderation" label="モデレーションを有効にします" hint="禁止トピック・PII を検出して停止します。">
          <div className="flex items-center gap-2 h-11">
            <input
              id="moderation"
              type="checkbox"
              checked={moderation}
              onChange={(e) => setModeration(e.target.checked)}
              className="w-4 h-4 accent-[var(--color-ai-action)]"
            />
            <span className="text-sm text-[var(--color-text-primary)]">
              {moderation ? "有効です" : "無効です"}
            </span>
          </div>
        </Field>
      </FormSection>

      <FormSection
        title="4. 出力形式"
        caption="JSON Schema / プレーンテキスト"
        icon={<FileJson aria-hidden className="w-4 h-4" />}
      >
        <Field id="format" label="形式">
          <select
            id="format"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] px-3 focus:outline focus:outline-2 focus:outline-[var(--color-ai-action)]"
          >
            <option value="json">JSON Schema</option>
            <option value="text">プレーンテキスト</option>
          </select>
        </Field>
        <Field id="max-tokens" label="最大トークン">
          <input
            id="max-tokens"
            type="text"
            inputMode="numeric"
            value={maxTokens}
            onChange={(e) => setMaxTokens(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] px-3 focus:outline focus:outline-2 focus:outline-[var(--color-ai-action)]"
          />
        </Field>
      </FormSection>

      <div className="sticky bottom-4 mt-6 flex justify-end">
        <button
          type="button"
          data-testid="model-settings-primary"
          aria-label="設定を保存して評価へ進みます"
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-[var(--color-ai-action)] text-white font-semibold shadow-md hover:bg-[#4338CA] focus:outline focus:outline-2 focus:outline-[var(--color-ai-action)]"
        >
          設定を保存して評価へ進みます
        </button>
      </div>
    </main>
  );
}
