"use client";

import { useState, useRef, useEffect } from "react";
import { createSupportSession, sendMessage, getGreeting, type SupportMessage } from "@/lib/support-agent";

const QUICK_REPLIES = [
  "ランクの条件は？",
  "報酬はいつ入る？",
  "紛争を申請したい",
  "法人プランは？",
];

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  function initSession() {
    if (sessionId) return;
    const s = createSupportSession("demo-user");
    setSessionId(s.id);
    setMessages([...s.messages]);
  }

  useEffect(() => {
    if (open) initSession();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages.length]);

  function handleSend(text: string) {
    if (!sessionId || !text.trim()) return;
    setInput("");
    const reply = sendMessage(sessionId, text.trim());
    setMessages((prev) => [
      ...prev,
      { role: "user" as const, content: text.trim(), timestamp: new Date().toISOString() },
      reply,
    ]);
  }

  return (
    <>
      {/* Floating bubble */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="サポートチャットを開く"
        aria-expanded={open}
        className="fixed right-4 bottom-24 lg:bottom-6 z-50 w-12 h-12 rounded-full shadow-xl flex items-center justify-center bg-kuroko text-white hover:opacity-90 active:scale-95 transition-all"
      >
        {open ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          role="dialog"
          aria-label="Shima サポートチャット"
          className="fixed right-4 bottom-40 lg:bottom-20 z-50 w-80 max-h-[480px] flex flex-col rounded-2xl shadow-2xl border border-white/10 bg-white overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-kuroko">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">S</div>
            <div>
              <p className="text-xs font-bold text-white">Shima サポート</p>
              <p className="text-[10px] text-white/60">オンライン · FAQ で自動応答</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-xl rounded-bl-sm px-3 py-2 bg-[var(--n-surface-2,#F5F3EE)] text-white text-xs leading-relaxed">
                  {getGreeting()}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-[var(--primary,#06B6D4)] text-white rounded-br-sm"
                      : "bg-[var(--n-surface-2,#F5F3EE)] text-white rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies (shown when few messages) */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="text-[10px] px-2 py-1 rounded-full border border-kaki/30 text-kaki hover:bg-kaki/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 px-3 py-2 border-t border-white/10">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
              placeholder="メッセージを入力…"
              className="flex-1 text-xs rounded-xl border border-white/10 bg-[var(--n-surface-2,#F5F3EE)] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-kaki/30"
              aria-label="メッセージを入力"
            />
            <button
              type="button"
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
              aria-label="送信"
              className="w-8 h-8 rounded-full bg-[var(--primary,#06B6D4)] text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
