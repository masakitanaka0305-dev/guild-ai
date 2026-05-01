import { listApplicationCards, type ApplicationCard } from "@/lib/admin-applications";

export const dynamic = "force-dynamic";

function rankBadgeClass(rank: ApplicationCard["rank"]): string {
  switch (rank) {
    // #133 — S aligns with brand-secondary (gold), A/B inherit the
    // brand action so admin chips stop fighting the global palette.
    case "S": return "bg-[var(--color-action-secondary)] text-[#0F172A]";
    case "A": return "bg-[var(--color-action-primary)] text-white";
    case "B": return "bg-[var(--color-action-primary-hover)] text-white";
    default:  return "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]";
  }
}

function Card({ card }: { card: ApplicationCard }) {
  return (
    <article className="rounded-2xl border border-[var(--n-divider,rgba(0,0,0,0.08))] bg-white p-5 shadow-sm">
      {/* Top: rank badge + last active */}
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center justify-center w-14 h-14 rounded-2xl text-2xl font-black ${rankBadgeClass(card.rank)}`}>
          {card.rank ?? "—"}
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--n-muted,#6B6456)]">最終活動</p>
          <p className="text-xs font-bold text-[var(--n-text,#1A1714)]">{card.lastActiveLabel}</p>
        </div>
      </div>

      {/* AI summary — the centerpiece of the company's first read */}
      {card.aiGeneratedSummary && (
        <p className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-3 leading-snug">
          {card.aiGeneratedSummary}
        </p>
      )}

      {/* Identity row */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-[var(--n-text,#1A1714)]">
          {card.identityRevealed && card.fullName ? card.fullName : card.displayHandle}
        </span>
        {card.ageBucket && (
          <>
            <span className="text-[var(--n-muted,#6B6456)] text-[10px]">·</span>
            <span className="text-[11px] text-[var(--n-muted,#6B6456)]">{card.ageBucket}</span>
          </>
        )}
        {card.prefecture && (
          <>
            <span className="text-[var(--n-muted,#6B6456)] text-[10px]">·</span>
            <span className="text-[11px] text-[var(--n-muted,#6B6456)]">{card.prefecture}</span>
          </>
        )}
      </div>

      {card.identityRevealed && card.email && (
        <p className="text-[11px] text-[var(--n-muted,#6B6456)] mb-3 font-mono">{card.email}</p>
      )}

      {/* Skills */}
      {card.primarySkills.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {card.primarySkills.map((skill) => (
            <li key={skill} className="text-[11px] font-bold px-2 py-1 rounded-full bg-[var(--n-surface-2,#F5F3EE)] text-[var(--n-text,#1A1714)]">
              {skill}
            </li>
          ))}
        </ul>
      )}

      {/* Status pill */}
      <div className="mt-4 flex items-center justify-between">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          card.status === "official"
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {card.status === "official" ? "GitHub解析済み" : "暫定"}
        </span>
        {card.identityRevealed && (
          <span className="text-[10px] font-bold text-green-700">マッチング成立</span>
        )}
      </div>
    </article>
  );
}

export default async function ApplicationsAdminPage() {
  if (process.env.ADMIN_BYPASS !== "true") {
    return (
      <main className="min-h-full flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-2">管理者アクセス制限</p>
          <p className="text-xs text-[var(--n-muted,#6B6456)] leading-relaxed">
            企業向け応募者一覧は v2 の認証ロールで保護されます。<br />
            開発中は <code className="font-mono bg-[var(--n-surface-2,#F5F3EE)] px-1 rounded">ADMIN_BYPASS=true</code> をセットしてください。
          </p>
        </div>
      </main>
    );
  }

  const cards = await listApplicationCards();

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
      <header className="mb-7">
        <p className="text-xs font-bold text-[var(--n-primary,#E64545)] tracking-wider mb-1">
          ENTERPRISE / 一次審査
        </p>
        <h1 className="text-2xl font-black text-[var(--n-text,#1A1714)] tracking-tight">
          応募者一覧
        </h1>
        <p className="mt-1.5 text-xs text-[var(--n-muted,#6B6456)]">
          {cards.length} 名 · 鑑定ランク降順
        </p>
      </header>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--n-divider,rgba(0,0,0,0.12))] p-10 text-center">
          <p className="text-sm text-[var(--n-muted,#6B6456)]">まだ応募者がいません。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cards.map((card) => <Card key={card.userId} card={card} />)}
        </div>
      )}

      <p className="mt-8 text-center text-[10px] text-[var(--n-muted,#6B6456)] leading-relaxed">
        匿名化ポリシー: 実名・メールは escrow が「executing」以上に進んでから解放されます
      </p>
    </main>
  );
}
