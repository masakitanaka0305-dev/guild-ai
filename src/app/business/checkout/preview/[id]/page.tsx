import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_MARKETPLACE } from "@/lib/marketplace";
import { maskForEnterprise } from "@/lib/confidentiality-filter";
import { BackArrow } from "@/components/ui/BackArrow";

export function generateStaticParams() {
  return MOCK_MARKETPLACE.map((m) => ({ id: m.listing.id }));
}

export const metadata = {
  title: "企業向けプレビュー — GUILD AI",
};

/**
 * Enterprise preview surface — runs the marketplace listing's body
 * through the Confidentiality Filter before rendering. The toggle
 * lives in the admin console; this public-facing preview is always
 * masked.
 */
export default function EnterprisePreviewPage({ params }: { params: { id: string } }) {
  const item = MOCK_MARKETPLACE.find((m) => m.listing.id === params.id);
  if (!item) notFound();

  const { listing } = item;
  // Demo body so the masker has something to chew on. In production
  // this would be the actual MD body fetched from storage.
  const demoBody =
    `# ${listing.title}\n\n` +
    `本資料の問い合わせは contact@${listing.ownerId}.example までお願いします。\n` +
    `担当: 田中 雅基 (090-1111-2222)\n\n` +
    `## 概要\n${listing.description}\n`;
  const masked = maskForEnterprise(demoBody, {
    companies: ["Acme Robotics", "GUILD AI Inc."],
  });

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
      <div className="-ml-2 mb-2 flex items-center gap-1">
        <BackArrow href="/business/checkout" label="プラン申し込みに戻る" />
        <Link href="/business/checkout" className="text-xs text-slate-400 hover:text-white">
          プラン申し込み
        </Link>
      </div>

      <header className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
          Confidentiality Filter — 企業向けプレビュー
        </p>
        <h1 className="text-2xl font-semibold text-white mt-1">{listing.title}</h1>
        <p
          data-testid="redaction-count"
          className="mt-2 text-xs text-slate-400"
        >
          {masked.redactionCount} 件の機密情報をマスクしました
        </p>
      </header>

      <article
        data-testid="enterprise-preview-body"
        className="rounded-2xl border border-brand-primary/20 bg-midnight-surface p-6 whitespace-pre-wrap font-mono text-sm text-slate-200 leading-relaxed"
      >
        {masked.text}
      </article>

      <p className="mt-4 text-[11px] text-slate-400">
        個人名・メール・電話・社名は <span className="font-mono">[REDACTED]</span> として表示されています。
      </p>
    </main>
  );
}
