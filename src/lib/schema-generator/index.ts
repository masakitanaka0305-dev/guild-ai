// Schema-Auto-Generation: keyword-based mock, no external calls

export type SchemaProp = {
  type: string;
  format?: string;
  contentEncoding?: string;
  contentMediaType?: string;
  items?: { type: string };
  description?: string;
};

export interface JSONSchema {
  type: string;
  properties?: Record<string, SchemaProp>;
  required?: string[];
  description?: string;
}

export interface SchemaExample {
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

export interface GeneratedSchemas {
  input: JSONSchema;
  output: JSONSchema;
  examples: SchemaExample[];
}

interface SchemaMeta {
  title: string;
  rank: string;
  category?: string;
}

// ─── Deterministic seed helper ────────────────────────────────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function lcg(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

// ─── Common meta fields appended to every schema ─────────────────────────────

const META_PROPERTIES = {
  meta: {
    type: "object",
    description: "Request metadata",
    // Nested inline — kept flat for simplicity in the generated output
  },
} as const;

const META_EXAMPLE = {
  meta: { id: "req_0001", ts: "2026-04-29T00:00:00Z", version: "1" },
};

// ─── Core generator ───────────────────────────────────────────────────────────

export function generateSchemas(
  mdContent: string,
  meta: SchemaMeta,
): GeneratedSchemas {
  const text = (mdContent + " " + meta.title + " " + (meta.category ?? "")).toLowerCase();

  const inputProps: Record<string, SchemaProp> = {};
  const outputProps: Record<string, SchemaProp> = {};
  const inputRequired: string[] = [];
  const outputRequired: string[] = [];

  // ── Keyword rules ──────────────────────────────────────────────────────────

  if (text.includes("pdf") || text.includes("ファイル")) {
    inputProps.file = {
      type: "string",
      contentEncoding: "base64",
      contentMediaType: "application/pdf",
      description: "Base64-encoded PDF file content",
    };
    inputRequired.push("file");
  }

  if (text.includes("url") || text.includes("リンク") || text.includes("ウェブ")) {
    inputProps.url = { type: "string", format: "uri", description: "Target URL to process" };
    inputRequired.push("url");
  }

  if (text.includes("json") || text.includes("解析") || text.includes("構造化")) {
    outputProps.fields = {
      type: "array",
      items: { type: "string" },
      description: "Extracted field names",
    };
    outputProps.data = {
      type: "object",
      description: "Extracted structured data as key-value pairs",
    };
    outputRequired.push("fields", "data");
  }

  if (text.includes("翻訳") || text.includes("translate")) {
    inputProps.text = { type: "string", description: "Source text to translate" };
    inputProps.targetLang = { type: "string", format: "iso-639-1", description: "Target language code (e.g. 'en')" };
    outputProps.text = { type: "string", description: "Translated text" };
    inputRequired.push("text");
    outputRequired.push("text");
  }

  if (text.includes("請求書") || text.includes("invoice")) {
    inputProps.file = inputProps.file ?? {
      type: "string",
      contentEncoding: "base64",
      contentMediaType: "application/pdf",
      description: "Invoice PDF (base64)",
    };
    outputProps.vendor = { type: "string", description: "Vendor / supplier name" };
    outputProps.totalAmount = { type: "string", description: "Total amount including tax" };
    outputProps.date = { type: "string", format: "date", description: "Invoice date (YYYY-MM-DD)" };
    if (!inputRequired.includes("file")) inputRequired.push("file");
    outputRequired.push("vendor", "totalAmount", "date");
  }

  if (text.includes("サマリ") || text.includes("要約") || text.includes("summary")) {
    inputProps.text = inputProps.text ?? { type: "string", description: "Source document text" };
    outputProps.summary = { type: "string", description: "Condensed summary" };
    outputProps.keyPoints = {
      type: "array",
      items: { type: "string" },
      description: "Bullet-point key points",
    };
    if (!inputRequired.includes("text")) inputRequired.push("text");
    outputRequired.push("summary");
  }

  // ── Defaults if no rules fired ─────────────────────────────────────────────

  if (Object.keys(inputProps).length === 0) {
    inputProps.query = { type: "string", description: "Task query or instruction" };
    inputRequired.push("query");
  }

  if (Object.keys(outputProps).length === 0) {
    outputProps.result = { type: "string", description: "Task execution result" };
    outputRequired.push("result");
  }

  // Always attach meta
  inputProps.meta = META_PROPERTIES.meta as SchemaProp;
  outputProps.meta = META_PROPERTIES.meta as SchemaProp;

  const input: JSONSchema = {
    type: "object",
    description: `Input schema for ${meta.title}`,
    properties: inputProps,
    required: inputRequired,
  };

  const output: JSONSchema = {
    type: "object",
    description: `Output schema for ${meta.title}`,
    properties: outputProps,
    required: outputRequired,
  };

  // ── Deterministic examples ─────────────────────────────────────────────────

  const seed = djb2(meta.title + meta.rank);
  const examples = [buildExample(input, output, seed, 0), buildExample(input, output, lcg(seed), 1)];

  return { input, output, examples };
}


function buildExample(
  input: JSONSchema,
  output: JSONSchema,
  seed: number,
  idx: number,
): SchemaExample {
  const exInput: Record<string, unknown> = {};
  exInput.meta = { id: `req_${String(seed % 9000 + 1000).padStart(4, "0")}`, ts: "2026-04-29T00:00:00Z", version: "1" };

  for (const [key, prop] of Object.entries(input.properties ?? {}) as [string, SchemaProp][]) {
    if (key === "meta") continue;
    if (prop.contentMediaType === "application/pdf") {
      exInput[key] = "JVBERi0xLjQK..."; // truncated base64
    } else if (prop.format === "uri") {
      exInput[key] = "https://example.com/doc.html";
    } else if (prop.format === "iso-639-1") {
      exInput[key] = idx === 0 ? "en" : "zh";
    } else {
      exInput[key] = `サンプル入力 ${idx + 1}`;
    }
  }

  const exOutput: Record<string, unknown> = {};
  exOutput.meta = exInput.meta;

  const s2 = lcg(seed);
  for (const [key, prop] of Object.entries(output.properties ?? {}) as [string, SchemaProp][]) {
    if (key === "meta") continue;
    if (prop.type === "array") {
      exOutput[key] = [`フィールド_A`, `フィールド_B`];
    } else if (prop.type === "object") {
      exOutput[key] = { sample_key: "sample_value" };
    } else if (prop.format === "date") {
      exOutput[key] = "2026-04-29";
    } else if (key === "totalAmount") {
      exOutput[key] = `¥${(10000 + (s2 % 90000)).toLocaleString("ja-JP")}`;
    } else {
      exOutput[key] = `サンプル出力 ${idx + 1}`;
    }
  }

  return { input: exInput, output: exOutput };
}

// ─── OpenAPI exporter ─────────────────────────────────────────────────────────

export function toOpenApiSpec(
  guildId: string,
  title: string,
  schemas: GeneratedSchemas,
): Record<string, unknown> {
  return {
    openapi: "3.1.0",
    info: { title, version: "1.0.0", description: `Auto-generated spec for ${guildId}` },
    paths: {
      [`/api/note/${guildId}`]: {
        post: {
          summary: title,
          requestBody: {
            required: true,
            content: { "application/json": { schema: schemas.input } },
          },
          responses: {
            "200": {
              description: "Success",
              content: { "application/json": { schema: schemas.output } },
            },
          },
        },
      },
    },
  };
}
