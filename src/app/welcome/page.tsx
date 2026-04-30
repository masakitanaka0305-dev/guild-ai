"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { saveProfileAction } from "@/app/actions/profile";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: CURRENT_YEAR - 18 - 1949 + 1 }, (_, i) => CURRENT_YEAR - 18 - i);

function splitDisplayName(name: string | null | undefined): { lastName: string; firstName: string } {
  if (!name) return { lastName: "", firstName: "" };
  const trimmed = name.trim();
  // Heuristic: full-width or ASCII space splits last vs first.
  const parts = trimmed.split(/[\s　]+/);
  if (parts.length >= 2) return { lastName: parts[0], firstName: parts.slice(1).join(" ") };
  return { lastName: trimmed, firstName: "" };
}

export default function WelcomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [pending, startTransition] = useTransition();

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [birthYear, setBirthYear] = useState<number | "">("");
  const [error, setError] = useState("");

  // Prefill from OAuth session as soon as it's available.
  useEffect(() => {
    if (status !== "authenticated") return;
    const sess = session as typeof session & { lastName?: string; firstName?: string };
    if (sess?.lastName || sess?.firstName) {
      setLastName(sess.lastName ?? "");
      setFirstName(sess.firstName ?? "");
      return;
    }
    const split = splitDisplayName(session?.user?.name);
    setLastName(split.lastName);
    setFirstName(split.firstName);
  }, [session, status]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!lastName.trim() || !firstName.trim()) { setError("姓・名を入力してください"); return; }
    if (!prefecture) { setError("都道府県を選択してください"); return; }
    if (!birthYear) { setError("生年を選択してください"); return; }

    startTransition(async () => {
      const result = await saveProfileAction({
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        prefecture,
        birthYear: Number(birthYear),
      });
      if (!result.ok) { setError(result.error); return; }
      router.push("/projects");
    });
  }

  if (status === "loading") {
    return (
      <main className="min-h-full flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--n-primary,#E64545)] border-t-transparent animate-spin" />
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-full flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-sm text-[var(--n-muted,#6B6456)] mb-4">
            セッションが見つかりませんでした。
          </p>
          <button onClick={() => router.push("/login")}
            className="px-4 py-2 rounded-xl bg-[var(--n-primary,#E64545)] text-white text-sm font-bold">
            ログインへ戻る
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <p className="text-xs font-bold text-[var(--n-primary,#E64545)] tracking-wider mb-1">
            STEP 1 / 1
          </p>
          <h1 className="text-2xl font-black text-[var(--n-text,#1A1714)] tracking-tight">
            あと10秒で完了
          </h1>
          <p className="mt-1.5 text-xs text-[var(--n-muted,#6B6456)]">
            残りはGitHubから自動解析します
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (prefilled from OAuth) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="lastName" className="block text-[11px] font-bold text-[var(--n-text,#1A1714)] mb-1">姓</label>
              <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                placeholder="佐藤"
                className="w-full px-3 py-2.5 text-sm border border-[var(--n-divider,rgba(0,0,0,0.12))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--n-primary,#E64545)]"
              />
            </div>
            <div>
              <label htmlFor="firstName" className="block text-[11px] font-bold text-[var(--n-text,#1A1714)] mb-1">名</label>
              <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder="健太"
                className="w-full px-3 py-2.5 text-sm border border-[var(--n-divider,rgba(0,0,0,0.12))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--n-primary,#E64545)]"
              />
            </div>
          </div>

          {/* Prefecture */}
          <div>
            <label htmlFor="pref" className="block text-[11px] font-bold text-[var(--n-text,#1A1714)] mb-1">居住地</label>
            <select id="pref" value={prefecture} onChange={(e) => setPrefecture(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[var(--n-divider,rgba(0,0,0,0.12))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--n-primary,#E64545)]"
            >
              <option value="">選択してください</option>
              {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Birth year */}
          <div>
            <label htmlFor="birth" className="block text-[11px] font-bold text-[var(--n-text,#1A1714)] mb-1">生年</label>
            <select id="birth" value={birthYear} onChange={(e) => setBirthYear(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-3 py-2.5 text-sm border border-[var(--n-divider,rgba(0,0,0,0.12))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--n-primary,#E64545)]"
            >
              <option value="">選択してください</option>
              {BIRTH_YEARS.map((y) => <option key={y} value={y}>{y}年</option>)}
            </select>
          </div>

          {error && <p role="alert" className="text-xs text-red-600 font-bold">⚠ {error}</p>}

          <button type="submit" disabled={pending}
            className="w-full py-3 rounded-xl bg-[var(--n-primary,#E64545)] text-white text-sm font-black hover:bg-[#D03A3A] disabled:opacity-50 transition-colors"
          >
            {pending ? "保存中…" : "解析を開始して案件を見る →"}
          </button>
        </form>

        <p className="mt-5 text-center text-[10px] text-[var(--n-muted,#6B6456)] leading-relaxed">
          解析中はバックグラウンドで GitHub から<br />言語比・コントリビューション・スター数を取得します
        </p>
      </div>
    </main>
  );
}
