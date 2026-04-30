export default function OfflinePage() {
  return (
    <main className="px-4 py-16 max-w-sm mx-auto text-center">
      <p className="text-5xl mb-6" aria-hidden>📡</p>
      <h1 className="text-xl font-black text-[var(--n-text,#1A1714)] mb-3">
        オフラインです
      </h1>
      <p className="text-sm text-[var(--n-muted,#6B6456)] mb-6 leading-relaxed">
        ネットワーク接続が復旧したら、このページは自動的に更新されます。
        <br />
        キャッシュ済みのページは引き続き閲覧できます。
      </p>
      <a
        href="/projects"
        className="inline-block px-6 py-3 rounded-xl bg-[var(--n-primary,#E64545)] text-white font-bold text-sm hover:bg-[#D03A3A] transition-colors"
      >
        案件を探す
      </a>
    </main>
  );
}
