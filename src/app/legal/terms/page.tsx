import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-10 max-w-2xl mx-auto">
      <Link href="/sell" className="text-xs text-[var(--n-muted,#6B6456)] hover:underline">← 出品に戻る</Link>
      <h1 className="text-2xl font-bold text-[var(--n-text,#1A1714)] mt-4 mb-2">API 利用規約</h1>
      <p className="text-xs text-[var(--n-muted,#6B6456)] mb-8">バージョン: 2026-04 · 最終更新: 2026-04-30</p>

      <div className="space-y-6 text-sm text-[var(--n-text,#1A1714)] leading-relaxed">
        <section>
          <h2 className="font-bold mb-2">第 1 条（目的）</h2>
          <p>本規約は、GUILD AI プラットフォーム（以下「当社」）が提供する API サービス（以下「本サービス」）の利用条件を定めるものです。ユーザーは本規約に同意した上で本サービスを利用するものとします。</p>
        </section>
        <section>
          <h2 className="font-bold mb-2">第 2 条（利用登録）</h2>
          <p>本サービスへの登録申請は、本規約に同意の上、当社所定の方法により行うものとします。未成年者は保護者の同意を得た上で登録してください。</p>
        </section>
        <section>
          <h2 className="font-bold mb-2">第 3 条（API 呼出し）</h2>
          <p>ユーザーは API キーを適切に管理し、第三者に譲渡・貸与してはなりません。呼出し回数に応じた従量課金が発生する場合があります。</p>
        </section>
        <section>
          <h2 className="font-bold mb-2">第 4 条（禁止事項）</h2>
          <p>法令違反行為、当社サーバーへの過度な負荷、逆コンパイル、競合サービスへのデータ転用、その他当社が不適切と判断する行為を禁止します。</p>
        </section>
        <section>
          <h2 className="font-bold mb-2">第 5 条（免責事項）</h2>
          <p>当社は、本サービスの正確性・完全性・有用性について保証しません。本サービスの利用により生じた損害について、当社は一切の責任を負いません（モックプラットフォームのため）。</p>
        </section>
        <section>
          <h2 className="font-bold mb-2">第 6 条（準拠法）</h2>
          <p>本規約は日本法を準拠法とし、東京地方裁判所を専属的合意管轄裁判所とします。</p>
        </section>
        <p className="text-xs text-[var(--n-muted,#6B6456)] pt-4 border-t border-[var(--n-divider,rgba(0,0,0,0.08))]">
          ※ 本ページはモックです。法的拘束力はありません。
        </p>
      </div>
    </main>
  );
}
