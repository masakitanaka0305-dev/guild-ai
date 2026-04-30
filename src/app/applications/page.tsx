"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ListChecks, X } from "lucide-react";

const STATUS_STEPS = ["受付", "AI鑑定中", "クライアント確認中"] as const;
type Status = typeof STATUS_STEPS[number];

const STATUS_CHIP: Record<Status, string> = {
  "受付":               "bg-slate-700/60 text-slate-200 ring-slate-500/30",
  "AI鑑定中":           "bg-cyan-900/40 text-cyan-200 ring-cyan-400/30",
  "クライアント確認中": "bg-amber-900/40 text-amber-200 ring-amber-400/30",
};

const STATUS_DOT: Record<Status, string> = {
  "受付":               "bg-slate-400",
  "AI鑑定中":           "bg-cyan-400",
  "クライアント確認中": "bg-amber-400",
};

interface AppRow {
  id: string;
  projectTitle: string;
  mdGuildId: string;
  status: Status;
  appliedAt: string;
}

type SortKey = "latest" | "status";

const STATUS_ORDER: Record<Status, number> = {
  "AI鑑定中": 0,
  "クライアント確認中": 1,
  "受付": 2,
};

function StatusChip({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${STATUS_CHIP[status] ?? "bg-slate-700/60 text-slate-200 ring-slate-500/30"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-slate-400"}`} />
      {status}
    </span>
  );
}

function Timeline({ status }: { status: Status }) {
  const current = STATUS_STEPS.indexOf(status);
  return (
    <ol className="flex items-center gap-1.5 text-[11px]" aria-label="進捗">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <li key={step} className="flex items-center gap-1.5">
            <span
              aria-current={active ? "step" : undefined}
              className={`inline-flex items-center gap-1 ${done ? "text-white" : "text-slate-400"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${done ? STATUS_DOT[step] : "bg-slate-700"}`} />
              <span className="font-medium">{step}</span>
            </span>
            {i < STATUS_STEPS.length - 1 && (
              <ArrowRight className="w-3 h-3 text-slate-400" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full bg-rose-900/40 px-3 py-1 text-[11px] font-bold text-rose-200 ring-1 ring-rose-400/30 hover:bg-rose-900/60 focus:outline focus:outline-2 focus:outline-rose-300"
      aria-label="この応募を取り消す"
    >
      取り消す
    </button>
  );
}

function ConfirmCancelModal({ row, onConfirm, onDismiss }: {
  row: AppRow; onConfirm: () => void; onDismiss: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-heading"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 py-6"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#162035] border border-white/10 p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 id="cancel-modal-heading" className="text-base font-bold text-white">
              応募を取り消しますか？
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              「{row.projectTitle}」への応募を取り消します。再応募はいつでも可能です。
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full p-1 text-slate-400 hover:bg-white/5"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/5"
          >
            やめる
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-rose-900/60 px-4 py-2 text-xs font-bold text-rose-100 ring-1 ring-rose-400/40 hover:bg-rose-900/80"
          >
            取り消す
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [sort, setSort] = useState<SortKey>("latest");
  const [pendingCancel, setPendingCancel] = useState<AppRow | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("applications") || "[]";
    setApps(JSON.parse(stored));
  }, []);

  // Demo data if empty so the page is never bare during the soft-launch.
  const baseRows: AppRow[] = apps.length > 0 ? apps as AppRow[] : [
    { id: "demo_1", projectTitle: "金融インフラ監視パイプライン", mdGuildId: "GUILD:001", status: "AI鑑定中",            appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString() },
    { id: "demo_2", projectTitle: "EC在庫管理API",                mdGuildId: "GUILD:002", status: "受付",                  appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString() },
    { id: "demo_3", projectTitle: "RAG社内ナレッジ検索",          mdGuildId: "GUILD:003", status: "クライアント確認中",   appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString() },
  ];

  const rows = useMemo(() => {
    const copy = [...baseRows];
    if (sort === "latest") {
      copy.sort((a, b) => +new Date(b.appliedAt) - +new Date(a.appliedAt));
    } else {
      copy.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    }
    return copy;
  }, [baseRows, sort]);

  function handleCancel(row: AppRow) {
    setApps((cur) => {
      const next = cur.filter((r) => r.id !== row.id);
      sessionStorage.setItem("applications", JSON.stringify(next));
      return next;
    });
    setPendingCancel(null);
  }

  if (rows.length === 0) {
    return (
      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
        <h1 className="hidden lg:block text-xl font-semibold tracking-tight text-white mb-4">
          応募状況
        </h1>
        <div className="section-card p-8 flex flex-col items-center text-center gap-3">
          <ListChecks className="w-8 h-8 stroke-cyan-400" aria-hidden />
          <p className="text-sm text-white font-semibold">まだ応募していません</p>
          <p className="text-xs text-slate-400">
            あなたの知能に合う案件を見つけて応募しましょう。
          </p>
          <Link
            href="/projects"
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-cyan-400 px-4 py-2 text-xs font-bold text-[#0B1121] hover:shadow-[0_0_0_2px_rgba(34,211,238,0.4),0_0_18px_rgba(34,211,238,0.25)]"
          >
            探す
            <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
      <div className="hidden lg:flex items-end justify-between mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-white">応募状況</h1>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-400">{rows.length} 件の応募</p>
        <label className="text-xs text-slate-400 inline-flex items-center gap-2">
          並び替え
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-[#162035] border border-white/10 rounded-md px-2 py-1 text-xs text-white focus:outline focus:outline-2 focus:outline-cyan-400"
          >
            <option value="latest">最新順</option>
            <option value="status">ステータス順</option>
          </select>
        </label>
      </div>

      {/* Mobile: vertical card list */}
      <ul className="lg:hidden space-y-3" aria-label="応募一覧">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-2xl border border-white/10 bg-[#162035] p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-white leading-snug min-w-0 flex-1">
                {row.projectTitle}
              </p>
              <StatusChip status={row.status} />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono text-slate-400">{row.mdGuildId}</span>
              <time className="text-slate-400">
                {new Date(row.appliedAt).toLocaleDateString("ja-JP")}
              </time>
            </div>
            <Timeline status={row.status} />
            <div className="flex justify-end pt-1">
              <CancelButton onClick={() => setPendingCancel(row)} />
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: 4-column table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
              <th className="pb-3 pr-4">Project</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">MD</th>
              <th className="pb-3 pr-4">Applied</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-800 hover:bg-slate-900/50">
                <td className="py-3 pr-4 text-white font-semibold">{row.projectTitle}</td>
                <td className="py-3 pr-4"><StatusChip status={row.status} /></td>
                <td className="py-3 pr-4 text-slate-400 text-xs font-mono">{row.mdGuildId}</td>
                <td className="py-3 pr-4 text-slate-400 text-xs">
                  {new Date(row.appliedAt).toLocaleDateString("ja-JP")}
                </td>
                <td className="py-3">
                  <CancelButton onClick={() => setPendingCancel(row)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pendingCancel && (
        <ConfirmCancelModal
          row={pendingCancel}
          onConfirm={() => handleCancel(pendingCancel)}
          onDismiss={() => setPendingCancel(null)}
        />
      )}
    </main>
  );
}
