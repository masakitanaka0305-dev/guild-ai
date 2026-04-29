// Shima-Support Agent — FAQ-based deterministic support chat

export interface SupportMessage {
  role: "user" | "agent";
  content: string;
  timestamp: string;
}

export interface SupportSession {
  id: string;
  userId: string;
  messages: SupportMessage[];
  createdAt: string;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

let _counter = 0;
const _sessions = new Map<string, SupportSession>();

// ─── FAQ response map ─────────────────────────────────────────────────────────

const FAQ_PAIRS: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ["ランク", "rank", "s", "a", "b", "鑑定"],
    response:
      "ランクは S / A / B の3段階です。S ランクには思考密度≥70・稼働日数≥30・意思シグナル3件以上・実稼働コード・テスト証跡が必要です。",
  },
  {
    keywords: ["報酬", "収益", "売上", "jpyc", "円"],
    response:
      "報酬は API コール単位で発生し、運用ページで確認できます。JPYC（デジタル円）または JPY で受け取れます。",
  },
  {
    keywords: ["登録", "出品", "sell", "bank", "投稿"],
    response:
      "/sell または /bank ページから登録できます。AIにお任せ・声で登録・手動入力の3通りから選べます。",
  },
  {
    keywords: ["dispute", "紛争", "クレーム", "問題", "返金"],
    response:
      "/disputes ページから紛争を申請できます。AI が自動で審査し、多くは24時間以内に解決されます。",
  },
  {
    keywords: ["法人", "enterprise", "business", "プラン"],
    response:
      "/business ページで法人プランの詳細と申し込みができます。Hobby / Pro Indie / Enterprise の3プランをご用意しています。",
  },
  {
    keywords: ["github", "scan", "スキャン", "bulk"],
    response:
      "/sell ページ下部の「GitHub からまとめて預ける」セクションから、リポジトリ URL を入力するだけで MD 資産を一括登録できます。",
  },
];

const DEFAULT_RESPONSE =
  "ご質問ありがとうございます。詳しくはドキュメントをご確認いただくか、運用ページからサポートチケットを発行してください。";

const GREETING =
  "こんにちは！GUILD AI サポートの Shima です。何でもお気軽にどうぞ。";

function agentReply(message: string): string {
  const lower = message.toLowerCase();
  for (const { keywords, response } of FAQ_PAIRS) {
    if (keywords.some((k) => lower.includes(k))) return response;
  }
  return DEFAULT_RESPONSE;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createSupportSession(userId: string): SupportSession {
  const id = `sup_${(++_counter).toString().padStart(4, "0")}`;
  const now = new Date().toISOString();
  const session: SupportSession = {
    id,
    userId,
    messages: [{ role: "agent", content: GREETING, timestamp: now }],
    createdAt: now,
  };
  _sessions.set(id, session);
  return session;
}

export function sendMessage(sessionId: string, userMessage: string): SupportMessage {
  const session = _sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const now = new Date().toISOString();
  session.messages.push({ role: "user", content: userMessage, timestamp: now });

  const reply: SupportMessage = {
    role: "agent",
    content: agentReply(userMessage),
    timestamp: now,
  };
  session.messages.push(reply);
  return reply;
}

export function getSessions(userId: string): SupportSession[] {
  return Array.from(_sessions.values()).filter((s) => s.userId === userId);
}

export function getGreeting(): string {
  return GREETING;
}

export function _resetSupportAgent(): void {
  _counter = 0;
  _sessions.clear();
}
