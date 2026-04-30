import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_MARKETPLACE } from "@/lib/marketplace";
import { buildReport } from "@/lib/compliance-report";
import { PrintButton } from "@/components/PrintButton";
import { mintGuildIdForAsset } from "@/lib/guild-id";

export function generateStaticParams() {
  return MOCK_MARKETPLACE.map((item) => ({ id: item.listing.id }));
}

export default function ReportPage({ params }: { params: { id: string } }) {
  const item = MOCK_MARKETPLACE.find((m) => m.listing.id === params.id);
  if (!item) notFound();

  const { listing } = item;
  const guildId = mintGuildIdForAsset(listing.id);
  const report = buildReport(guildId, { title: listing.title, rank: listing.rank });

  const verdictColor =
    report.overallVerdict === "合格"
      ? "text-emerald-700 bg-emerald-50 border-emerald-300"
      : report.overallVerdict === "条件付き合格"
      ? "text-amber-700 bg-amber-50 border-amber-300"
      : "text-red-700 bg-red-50 border-red-300";

  const btAccuracy = report.backtest.accuracyPct.toFixed(1);
  const btP95 = report.backtest.p95LatencyMs;
  const btError = report.backtest.errorRatePct.toFixed(2);
  const btSamples = report.backtest.samples.toLocaleString("ja-JP");

  return (
    <>
      {/* Print button — hidden on print */}
      <div className="print:hidden px-4 sm:px-6 lg:px-8 pt-6 max-w-4xl mx-auto flex items-center justify-between">
        <Link href={`/asset/${params.id}`} className="text-xs text-[var(--n-muted,#6B6456)] hover:underline">
          ← アセット詳細に戻る
        </Link>
        <PrintButton />
      </div>

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto print:px-0 print:py-0 print:max-w-none">
        {/* Report header */}
        <div className="section-card p-8 mb-6 print:shadow-none print:border print:border-gray-300 print:rounded-none">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--n-muted,#6B6456)] mb-1">
                GUILD AI 品質保証書
              </p>
              <h1 className="text-xl font-bold text-[var(--n-text,#1A1714)] mb-1">{listing.title}</h1>
              <p className="text-xs text-[var(--n-muted,#6B6456)] font-mono">{guildId}</p>
            </div>
            <div className="text-right shrink-0">
              <span className={`inline-block text-sm font-bold px-4 py-1.5 rounded-full border ${verdictColor}`}>
                {report.overallVerdict}
              </span>
              <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-1">
                証明書番号: {report.certNumber}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--n-divider,rgba(0,0,0,0.08))] grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] text-[var(--n-muted,#6B6456)]">発行日</p>
              <p className="text-xs font-semibold text-[var(--n-text,#1A1714)]">2026-04-30</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--n-muted,#6B6456)]">ランク</p>
              <p className="text-xs font-semibold text-[var(--n-text,#1A1714)]">{listing.rank}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--n-muted,#6B6456)]">オリジン署名</p>
              <p className="text-xs font-semibold text-[var(--n-text,#1A1714)] font-mono truncate">{report.originSignature}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--n-muted,#6B6456)]">テストサンプル数</p>
              <p className="text-xs font-semibold text-[var(--n-text,#1A1714)]">{btSamples} 件</p>
            </div>
          </div>
        </div>

        {/* Backtest results */}
        <section className="section-card p-6 mb-6 print:shadow-none print:border print:border-gray-300 print:rounded-none">
          <h2 className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-4">バックテスト結果</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "精度", value: `${btAccuracy}%`, highlight: true },
              { label: "P95 レイテンシ", value: `${btP95} ms` },
              { label: "エラー率", value: `${btError}%` },
              { label: "最終実行", value: report.backtest.lastRunAt.slice(0, 10) },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="section-card p-4 text-center print:border print:border-gray-200">
                <p className={`text-lg font-black ${highlight ? "text-[var(--primary,#06B6D4)]" : "text-[var(--n-text,#1A1714)]"}`}>
                  {value}
                </p>
                <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Monthly trend bar chart */}
          <div className="mt-5">
            <p className="text-[10px] text-[var(--n-muted,#6B6456)] mb-2">月次精度トレンド（過去12ヶ月）</p>
            <div className="flex items-end gap-0.5 h-14">
              {report.backtest.monthlyTrend.map((v, i) => {
                const pct = Math.max(0, Math.min(100, v));
                const heightPct = pct * 0.6 + 40;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full rounded-t bg-[var(--primary,#06B6D4)] opacity-70"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Security checks */}
        <section className="section-card p-6 mb-6 print:shadow-none print:border print:border-gray-300 print:rounded-none">
          <h2 className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-4">セキュリティチェック（OWASP 準拠）</h2>
          <div className="space-y-2">
            {report.securityChecks.map((chk) => (
              <div key={chk.id} className="flex items-center gap-3 py-2 border-b border-[var(--n-divider,rgba(0,0,0,0.06))] last:border-0">
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  chk.status === "PASS" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                  chk.status === "WARN" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                  "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {chk.status}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--n-text,#1A1714)]">
                    <span className="text-[var(--n-muted,#6B6456)] font-mono mr-1">{chk.id}</span>
                    {chk.label}
                  </p>
                  <p className="text-[10px] text-[var(--n-muted,#6B6456)] mt-0.5">{chk.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Compliance items */}
        <section className="section-card p-6 mb-6 print:shadow-none print:border print:border-gray-300 print:rounded-none">
          <h2 className="text-sm font-bold text-[var(--n-text,#1A1714)] mb-4">法令・規格準拠状況</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--n-divider,rgba(0,0,0,0.08))]">
                <th className="text-left py-2 font-semibold text-[var(--n-muted,#6B6456)] w-1/3">規格・法令</th>
                <th className="text-left py-2 font-semibold text-[var(--n-muted,#6B6456)]">条項</th>
                <th className="text-right py-2 font-semibold text-[var(--n-muted,#6B6456)] w-24">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {report.complianceItems.map((item) => (
                <tr key={item.standard} className="border-b border-[var(--n-divider,rgba(0,0,0,0.04))] last:border-0">
                  <td className="py-2 font-semibold text-[var(--n-text,#1A1714)] pr-4">{item.standard}</td>
                  <td className="py-2 text-[var(--n-muted,#6B6456)]">{item.article}</td>
                  <td className="py-2 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === "適合" ? "bg-emerald-50 text-emerald-700" :
                      item.status === "条件付き適合" ? "bg-amber-50 text-amber-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <div className="text-center text-[10px] text-[var(--n-muted,#6B6456)] mt-8 print:mt-4">
          <p>本証明書は GUILD AI Platform が自動生成したモックレポートです。法的拘束力はありません。</p>
          <p className="mt-0.5">{report.certNumber} · 発行: GUILD AI Inc. · 2026-04-30</p>
        </div>
      </main>
    </>
  );
}
