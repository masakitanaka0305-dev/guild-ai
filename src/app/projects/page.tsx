import Link from "next/link";
import { MOCK_PROJECTS } from "@/lib/projects";

export const metadata = { title: "案件一覧 | GUILD AI" };

const INDUSTRY_ICON: Record<string, string> = {
  "金融・インフラ":         "🏦",
  "EC・Retail":             "🛒",
  "エンタープライズ・HR":   "🏢",
  "製造・IoT":              "🏭",
  "法務・コンプライアンス": "⚖️",
  "ヘルスケア・モバイル":   "🩺",
};

export default function ProjectsPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[var(--n-text,#1A1714)] tracking-tight">
          案件一覧
        </h1>
        <p className="mt-1 text-sm text-[var(--n-muted,#6B6456)]">
          {MOCK_PROJECTS.length} 件掲載中 — 所持 MD の適合スコアで案件をフィルタできます
        </p>
      </div>

      <ol className="space-y-3" aria-label="案件一覧">
        {MOCK_PROJECTS.map((project) => (
          <li key={project.id}>
            <Link
              href={`/projects/${project.id}`}
              className="block section-card p-5 hover:shadow-md active:scale-[0.99] transition-all duration-150 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm" aria-hidden>
                      {INDUSTRY_ICON[project.industry] ?? "💼"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--n-muted,#6B6456)] bg-[var(--n-surface-2,#F5F3EE)] px-2 py-0.5 rounded-full">
                      {project.industry}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-[var(--n-text,#1A1714)] leading-snug group-hover:text-[var(--n-primary,#0000CC)] transition-colors">
                    {project.title}
                  </h2>
                  <p className="text-xs text-[var(--n-muted,#6B6456)] mt-1 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {project.techStack.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-muted,#6B6456)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-base font-black text-[var(--n-primary,#0000CC)]">
                    ¥{project.grossRewardJpy.toLocaleString("ja-JP")}
                  </p>
                  <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-0.5">
                    期限 {project.deadline}
                  </p>
                  <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-0.5">
                    {project.applicantCount} 名応募中
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
