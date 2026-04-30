import Link from "next/link";

export default function TransferPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-10 max-w-2xl mx-auto">
      <Link href="/sell" className="text-xs text-[var(--n-muted,#6B6456)] hover:underline">← 出品に戻る</Link>
      <h1 className="text-2xl font-bold text-[var(--n-text,#1A1714)] mt-4 mb-2">権利譲渡規約</h1>
      <p className="text-xs text-[var(--n-muted,#6B6456)] mb-8">バージョン: 2026-04 · 最終更新: 2026-04-30</p>

      <div className="space-y-6 text-sm text-[var(--n-text,#1A1714)] leading-relaxed">
        <section>
          <h2 className="font-bold mb-2">第 1 条（許諾の範囲）</h2>
          <p>投稿者（以下「クリエイター」）は、登録したコンテンツ（以下「MD」）について、GUILD AI プラットフォーム（以下「当社」）に対し、次の権利を非独占的に許諾します：複製権・公衆送信権・翻訳権・二次利用許諾権。</p>
        </section>
        <section>
          <h2 className="font-bold mb-2">第 2 条（著作権の帰属）</h2>
          <p>MD の著作権はクリエイターに帰属します。当社は MD を API 経由で第三者に提供し、クリエイターはその利用対価としてロイヤリティを受け取ります。</p>
        </section>
        <section>
          <h2 className="font-bold mb-2">第 3 条（引用配分）</h2>
          <p>他の MD に引用・派生された場合、引用元のクリエイターは利用料金の 10% を受け取ります（引用配分）。残りの 90% は派生 MD のクリエイターへ配分されます。</p>
        </section>
        <section>
          <h2 className="font-bold mb-2">第 4 条（禁止コンテンツ）</h2>
          <p>違法コンテンツ、第三者の著作権を侵害するコンテンツ、差別・ハラスメントを含むコンテンツの投稿を禁止します。違反が確認された場合、当社は該当 MD を削除し、ロイヤリティを没収できます。</p>
        </section>
        <section>
          <h2 className="font-bold mb-2">第 5 条（削除要求）</h2>
          <p>クリエイターは MD の削除を申請できます。ただし、既に第三者に提供された利用記録は保持されます。</p>
        </section>
        <section>
          <h2 className="font-bold mb-2">第 6 条（免責）</h2>
          <p>当社は、MD の内容に起因する第三者との紛争について一切の責任を負いません。クリエイター自身が権利関係を確認・保証するものとします。</p>
        </section>
        <p className="text-xs text-[var(--n-muted,#6B6456)] pt-4 border-t border-[var(--n-divider,rgba(0,0,0,0.08))]">
          ※ 本ページはモックです。法的拘束力はありません。
        </p>
      </div>
    </main>
  );
}
