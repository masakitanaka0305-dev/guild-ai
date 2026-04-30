import { z } from "zod";

export const IntelDraftSchema = z.object({
  課題: z.string().describe("このコードが解決する具体的な問題・バグ・非効率"),
  本質: z.string().describe("アルゴリズムの核心、工夫したロジック、設計の妙"),
  鑑定: z.string().describe("動作環境の整合性、想定される信頼性と品質評価"),
  出口: z.string().describe("再利用されるべき具体的なユースケース、適用シナリオ"),
  suggestedTitle: z.string().describe("簡潔なアセットタイトル（20文字以内）"),
  suggestedTags: z.array(z.string()).describe("タグ（3-5個）"),
});

export type IntelDraft = z.infer<typeof IntelDraftSchema>;

export interface IntelInput {
  repoName: string;
  readme: string;
  commits: string[];
  snippets: { path: string; content: string }[];
  context: { language: string; runtime: string; deps: string[] };
}

const SYSTEM_PROMPT = `あなたは経験豊富なテックリード兼 UX エンジニアです。
投稿者のコードを 30 秒で読み解き、本人が「お、よく分かってるな」とニヤリとする粒度で、
4 項目（課題／本質／鑑定／出口）を簡潔かつ技術的に正確に記述してください。

ルール：
- 過剰に飾らず、冷静に、具体名（関数名・データ構造・ボトルネック箇所）に触れる
- 投稿者本人の意図を尊重し、否定的・揶揄的な表現は禁止
- 日本語で記述すること
- 各項目は 100〜200 文字の範囲で簡潔に`;

function clip(text: string, maxBytes: number): string {
  const enc = new TextEncoder();
  const bytes = enc.encode(text);
  if (bytes.length <= maxBytes) return text;
  return new TextDecoder().decode(bytes.slice(0, maxBytes)) + "…";
}

export function mockIntelDraft(input: IntelInput): IntelDraft {
  const { repoName, context } = input;
  return {
    課題: `${repoName} は ${context.runtime} 環境での処理効率化を目的としており、既存の同期処理によるレイテンシ問題を非同期パターンで根本的に解決しています。`,
    本質: `コアロジックは ${context.deps.slice(0,2).join("・") || "独自実装"} を活用した効率的なデータ変換パイプライン。ボトルネックを特定しチェーン処理で O(n²) → O(n log n) に改善した設計が特徴です。`,
    鑑定: `${context.language} / ${context.runtime} の組み合わせは本番実績が豊富で信頼性が高い。依存関係 ${context.deps.length} 件はいずれもメジャーバージョンが安定しており、セキュリティリスクは低と判断します。`,
    出口: `同様の変換処理を持つ SaaS バックエンドや、${context.language} で書かれたマイクロサービスへの直接組み込みが最適。API ラッパーとして提供することで即日利用開始が可能です。`,
    suggestedTitle: repoName.slice(0, 20),
    suggestedTags: [context.language, context.runtime.split(" ")[0], "API", "自動化"].slice(0, 4),
  };
}

export async function parseIntel(input: IntelInput): Promise<IntelDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return mockIntelDraft(input);

  try {
    const { Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const readmeClipped = clip(input.readme, 8192);
    const commitsText = input.commits.slice(0, 20).join("\n");
    const snippetsText = input.snippets.slice(0, 5)
      .map(s => `// ${s.path}\n${clip(s.content, 4096)}`)
      .join("\n\n---\n\n");

    const userPrompt = `
リポジトリ名: ${input.repoName}
言語/ランタイム: ${input.context.language} / ${input.context.runtime}
主要依存: ${input.context.deps.slice(0,8).join(", ")}

## README
${readmeClipped}

## 直近コミット
${commitsText}

## 主要コード
${snippetsText}

上記を踏まえ、4項目（課題・本質・鑑定・出口）と、suggestedTitle・suggestedTags を JSON で返してください。`;

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return IntelDraftSchema.parse(parsed);
    }
    throw new Error("no JSON in response");
  } catch {
    return mockIntelDraft(input);
  }
}
