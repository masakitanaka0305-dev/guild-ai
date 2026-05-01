import Link from "next/link";

export const metadata = { title: "権利譲渡規約 | GUILD AI" };

export default function TransferPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-10 max-w-2xl mx-auto">
      <Link href="/sell" className="text-xs text-[var(--n-muted,#6B6456)] hover:underline">
        ← 出品に戻る
      </Link>
      <h1 className="text-2xl font-black text-[var(--n-text,#1A1714)] mt-4 mb-1 tracking-tight">
        権利譲渡規約
      </h1>
      <p className="text-xs text-[var(--n-muted,#6B6456)] mb-8">
        バージョン: 2026-04 · 最終更新: 2026-04-30
      </p>

      <article className="space-y-6 text-sm text-[var(--n-text,#1A1714)] leading-relaxed">
        <section>
          <h2 className="font-bold mb-2">第1条（許諾の範囲）</h2>
          <p>
            投稿者（以下「クリエイター」）は、本プラットフォームに登録するコンテンツ（以下「投稿物」）について、
            GUILD AI（以下「当社」）に対し、複製権・公衆送信権・翻訳権・二次的著作物作成権・サブライセンス権を含む
            全世界的・非独占的・無償のライセンスを付与するものとします。投稿物の著作権その他の権利は
            クリエイターに帰属し続けます。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">第2条（IP 帰属の確認義務）</h2>
          <p>
            クリエイターは、投稿物が自己の独自の創作物であること、または正当な権利者から適切な権限を付与されていることを
            確認した上で登録するものとします。雇用関係・委任関係・請負関係において業務上作成された成果物については、
            就業規則・雇用契約・委任契約等に定める帰属条項に従い、当該成果物の投稿・商用化に必要な権限を
            事前に取得しているものとみなします。権限取得の確認責任はクリエイター本人に帰属します。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">第3条（引用配分）</h2>
          <p>
            他の投稿物から引用・派生参照された場合、引用元クリエイターは当該利用対価の 10% を
            引用配当として受け取ります。残りの 90% は引用先（派生物）クリエイターへ配分されます。
            引用配当は自動的に算出され、当社の Escrow Reserve システムを通じて精算されます。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">第4条（権利侵害による損害の帰責）</h2>
          <p>
            クリエイターが第2条に定める確認義務を怠り、または虚偽の表明に基づき投稿物を登録したことにより、
            第三者から当社または他のユーザーに対して知的財産権侵害・営業秘密不正開示・NDA 違反等に基づく
            請求がなされた場合、クリエイターは自己の費用負担により当該請求に対応するものとします。
            当社が損害・費用・弁護士費用を負担した場合、クリエイターはこれを当社に対して速やかに補償します。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">第5条（削除要求と差止対応）</h2>
          <p>
            クリエイターは、登録した投稿物の削除を {" "}
            <Link href="/disputes" className="text-[var(--primary,#6366F1)] underline">
              /disputes
            </Link>{" "}
            から申請できます。削除が承認された場合、以後の新規提供は停止されますが、
            削除承認以前に成立した利用契約については、既存の条件が継続して適用されます。
            第三者から仮処分命令等の差止を受けた場合、当社は当該投稿物を即時停止する権限を有します。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">第6条（ロイヤリティの差し押さえ）</h2>
          <p>
            権利侵害が確認された投稿物に関して発生したロイヤリティは、紛争解決まで Escrow Reserve に
            留保されます。最終的に権利侵害が認定された場合、当社は当該ロイヤリティを没収し、
            被害者への補償原資とすることができます。
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-2">第7条（準拠法・管轄）</h2>
          <p>
            本規約は日本法を準拠法とし、本規約に関する一切の紛争は東京地方裁判所を
            第一審の専属的合意管轄裁判所とします。
          </p>
        </section>

        <div className="pt-4 border-t border-[var(--n-divider,rgba(0,0,0,0.08))]">
          <p className="text-xs text-[var(--n-muted,#6B6456)]">
            詳細な利用条件は{" "}
            <Link href="/legal/terms" className="text-[var(--primary,#6366F1)] underline">
              利用規約
            </Link>
            {" "}をあわせてご確認ください。
          </p>
        </div>
      </article>
    </main>
  );
}
