"use client";

import { useState } from "react";
import Link from "next/link";

type Lang = "ja" | "en";

interface Article {
  number: string;
  titleJa: string;
  titleEn: string;
  bodyJa: string;
  bodyEn: string;
}

const ARTICLES: Article[] = [
  {
    number: "第1条",
    titleJa: "適用範囲",
    titleEn: "Scope of Application",
    bodyJa:
      "本利用規約（以下「本規約」）は、GUILD AI（以下「当社」）が運営するインテリジェンス・マーケットプレイス・プラットフォーム（以下「本プラットフォーム」）の一切のサービスに適用されます。本プラットフォームを利用した時点で、ユーザーは本規約に同意したものとみなします。当社は、法令の改正その他の合理的な理由により本規約を変更することがあります。重大な変更がある場合には、本プラットフォーム上で事前に通知します。",
    bodyEn:
      "These Terms of Service (\"Terms\") apply to all services provided by GUILD AI (\"Company\") on the intelligence marketplace platform (\"Platform\"). By accessing or using the Platform, users agree to be bound by these Terms. The Company may revise these Terms for legally or commercially reasonable causes. Material changes will be notified in advance on the Platform.",
  },
  {
    number: "第2条",
    titleJa: "ユーザーの保証と表明",
    titleEn: "User Representations and Warranties",
    bodyJa:
      "ユーザーは、本プラットフォームにコンテンツ（以下「投稿物」）を登録する際、次の事項を保証し表明するものとします。（1）投稿物の一切の知的財産権を自らが保有していること、または正当な権限を有していること。（2）投稿物が第三者の特許権、著作権、商標権、営業秘密その他の知的財産権を侵害していないこと。（3）投稿物の投稿・商用化が、現在または過去の雇用契約、委任契約、機密保持契約（NDA）、就業規則その他の合意に違反していないこと。（4）不正競争防止法上の営業秘密に該当するコンテンツを無断で開示していないこと。",
    bodyEn:
      "When registering content (\"Submission\") on the Platform, users represent and warrant that: (1) they own or have duly authorized rights to all intellectual property in the Submission; (2) the Submission does not infringe any patent, copyright, trademark, trade secret, or other intellectual property rights of any third party; (3) the posting or commercialization of the Submission does not violate any current or prior employment agreement, service agreement, non-disclosure agreement (NDA), work rules, or other contractual obligations; and (4) no trade secrets protected under the Unfair Competition Prevention Act are disclosed without authorization.",
  },
  {
    number: "第3条",
    titleJa: "投稿コンテンツの権利許諾",
    titleEn: "License Grant",
    bodyJa:
      "ユーザーは、投稿物を本プラットフォームに登録することにより、当社に対し、当該投稿物の複製・公衆送信・翻訳・二次的著作物の作成・サブライセンス付与に関する、全世界的・非独占的・無償・サブライセンス可能なライセンスを付与するものとします。投稿物の著作権その他の権利はユーザーに帰属し続けます。当社は、本プラットフォームの提供・改善・宣伝のためにのみ当該ライセンスを行使します。",
    bodyEn:
      "By registering a Submission on the Platform, users grant the Company a worldwide, non-exclusive, royalty-free, sublicensable license to reproduce, publicly transmit, translate, create derivative works, and sublicense the Submission solely for operating, improving, and promoting the Platform. Ownership of all intellectual property in Submissions remains with the user.",
  },
  {
    number: "第4条",
    titleJa: "違反時のユーザー責任",
    titleEn: "User Liability for Violations",
    bodyJa:
      "ユーザーが第2条の保証・表明に違反したことにより、当社または第三者に損害が生じた場合、当該ユーザーは自己の費用と責任において、損害賠償、訴訟費用（合理的な弁護士費用を含む）、差止命令対応費用その他一切の費用を負担するものとします。当社は、ユーザーの違反に起因する請求・損失・費用について一切の責任を負わず、ユーザーは当社を免責・補償することに同意します。",
    bodyEn:
      "If a user breaches any representation or warranty in Article 2 and causes damage to the Company or any third party, such user shall, at their own cost and expense, bear all damages, litigation costs (including reasonable attorneys' fees), costs of injunctive relief, and any other costs and liabilities arising therefrom. The Company accepts no liability for claims, losses, or expenses arising from user violations, and users agree to indemnify and hold the Company harmless from all such claims.",
  },
  {
    number: "第5条",
    titleJa: "禁止行為",
    titleEn: "Prohibited Conduct",
    bodyJa:
      "ユーザーは、次の行為を行ってはなりません。（1）他者の営業秘密・著作物・個人情報を当該権利者の許諾なく投稿・販売する行為。（2）現在または過去の雇用主・クライアントの財産（アーキテクチャ設計・コードベース・内部データ等）を無断で商用化する行為。（3）当社または第三者のシステムへの不正アクセス、DDoS 攻撃その他サービスの妨害行為。（4）マネーロンダリングその他違法な資金移動に本プラットフォームを利用する行為。（5）虚偽の情報による登録・評価操作行為。",
    bodyEn:
      "Users must not: (1) post or sell trade secrets, copyrighted works, or personal information of others without the rights holder's consent; (2) commercialize without authorization any assets (architectural designs, codebases, internal data, etc.) belonging to current or former employers or clients; (3) engage in unauthorized access, DDoS attacks, or any conduct that disrupts the Company's or third parties' systems; (4) use the Platform for money laundering or any other illegal financial activity; or (5) register false information or manipulate ratings.",
  },
  {
    number: "第6条",
    titleJa: "通報・削除・アカウント凍結",
    titleEn: "Reports, Takedowns, and Account Suspension",
    bodyJa:
      "権利侵害の疑いがある投稿物を発見した場合、権利者は /disputes ページから申告することができます。当社は申告を受理後、合理的な期間内に審査を行い、違反が認められた場合には当該投稿物の削除・ユーザーのアカウント凍結・ロイヤリティの差し押さえを行うことができます。繰り返し違反したユーザーは永久追放の対象となります。審査状況は /admin/reports で確認できます（権限を持つユーザーのみ）。",
    bodyEn:
      "If a suspected infringing Submission is found, the rights holder may file a report via the /disputes page. Upon receipt of a report, the Company will conduct a review within a reasonable timeframe. If a violation is found, the Company may remove the Submission, suspend the user's account, and withhold royalties. Repeat offenders may be subject to permanent ban. Review status can be checked at /admin/reports (authorized users only).",
  },
  {
    number: "第7条",
    titleJa: "プラットフォームの免責",
    titleEn: "Platform Disclaimer",
    bodyJa:
      "当社は、インフラの提供・マッチング機能・エスクロー管理機能を提供するものであり、投稿物の内容・正確性・合法性について保証しません。本プラットフォームの利用に起因して生じた直接的・間接的・偶発的・特別・派生的損害について、当社の責任は、当該損害が生じた月に当社がユーザーから受領した手数料相当額を上限とします。当社は、インフラ障害・サイバー攻撃・天災等の不可抗力によるサービス停止に関して責任を負いません。",
    bodyEn:
      "The Company provides infrastructure, matching functionality, and escrow management, and makes no warranty as to the content, accuracy, or legality of any Submission. The Company's total liability for any direct, indirect, incidental, special, or consequential damages arising from use of the Platform shall not exceed the fees received from the user in the month in which the damage occurred. The Company shall not be liable for service interruptions due to infrastructure failures, cyberattacks, force majeure, or other events beyond its reasonable control.",
  },
  {
    number: "第8条",
    titleJa: "準拠法・管轄裁判所",
    titleEn: "Governing Law and Jurisdiction",
    bodyJa:
      "本規約は日本法を準拠法とし、本規約に関する一切の紛争は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。海外ユーザーとの取引については、別途適用される国際版条項を定めることがあります。",
    bodyEn:
      "These Terms shall be governed by and construed in accordance with the laws of Japan, and any dispute arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the Tokyo District Court as the court of first instance. Separate international terms may apply to transactions with overseas users.",
  },
];

function Accordion({ article, lang }: { article: Article; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const title = lang === "ja" ? article.titleJa : article.titleEn;
  const body = lang === "ja" ? article.bodyJa : article.bodyEn;
  const heading = lang === "ja" ? `${article.number}（${title}）` : `${article.number.replace("第", "Art. ").replace("条", "")}: ${title}`;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-left py-3 px-4 rounded-lg hover:bg-[var(--n-surface-2,#F5F3EE)] transition-colors"
      >
        <span className="text-sm font-bold text-[var(--n-text,#1A1714)]">{heading}</span>
        <span className="text-xs text-[var(--n-muted,#6B6456)] ml-2">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-[var(--n-text,#1A1714)] leading-relaxed">{body}</p>
        </div>
      )}
    </section>
  );
}

export default function TermsPage() {
  const [lang, setLang] = useState<Lang>("ja");

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-10 max-w-2xl mx-auto">
      <Link href="/sell" className="text-xs text-[var(--n-muted,#6B6456)] hover:underline">
        ← 出品に戻る
      </Link>

      <h1 className="text-2xl font-black text-[var(--n-text,#1A1714)] mt-4 mb-1 tracking-tight">
        {lang === "ja" ? "利用規約" : "Terms of Service"}
      </h1>
      <p className="text-xs text-[var(--n-muted,#6B6456)] mb-6">
        バージョン: 2026-04 · 最終更新: 2026-04-30
      </p>

      {/* Language tab switcher */}
      <div
        role="tablist"
        aria-label="言語切替"
        className="flex gap-1 mb-6 p-1 bg-[var(--n-surface-2,#F5F3EE)] rounded-lg w-fit"
      >
        {(["ja", "en"] as Lang[]).map((l) => (
          <button
            key={l}
            role="tab"
            aria-selected={lang === l}
            onClick={() => setLang(l)}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
              lang === l
                ? "bg-white text-[var(--n-text,#1A1714)] shadow-sm"
                : "text-[var(--n-muted,#6B6456)] hover:text-[var(--n-text,#1A1714)]"
            }`}
          >
            {l === "ja" ? "日本語" : "English"}
          </button>
        ))}
      </div>

      <article>
        <div className="space-y-1 divide-y divide-[var(--n-divider,rgba(0,0,0,0.06))]">
          {ARTICLES.map((article) => (
            <Accordion key={article.number} article={article} lang={lang} />
          ))}
        </div>
      </article>

      <div className="mt-8 p-4 bg-[var(--n-surface-2,#F5F3EE)] rounded-lg">
        <p className="text-xs text-[var(--n-muted,#6B6456)] leading-relaxed">
          {lang === "ja"
            ? "本規約は日本法を準拠法とします。権利譲渡の詳細は"
            : "These Terms are governed by the laws of Japan. For IP transfer details, see "}
          <Link href="/legal/transfer" className="text-[var(--primary,#6366F1)] underline">
            {lang === "ja" ? "権利譲渡規約" : "Transfer Terms"}
          </Link>
          {lang === "ja" ? "をご確認ください。" : "."}
        </p>
      </div>
    </main>
  );
}
