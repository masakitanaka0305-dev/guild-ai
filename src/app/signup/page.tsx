"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction, type RegisterInput } from "@/app/actions/auth";

// ─── 郵便番号→住所 ルックアップ（zipcloud, 無料公開API） ──────────────────
// 送信内容は 7 桁の数値のみ。個人情報は一切送信しない。
type ZipcloudResult = { address1: string; address2: string; address3: string };
type ZipStatus = "idle" | "loading" | "ok" | "not_found" | "error";

async function lookupZipcloud(zip7digits: string): Promise<ZipcloudResult | null> {
  const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip7digits}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as { status: number; results: ZipcloudResult[] | null };
  return data.status === 200 && data.results?.[0] ? data.results[0] : null;
}

// ─── 電話番号オートフォーマット ────────────────────────────────────────────
// 入力された数値から日本の番号体系に応じてハイフンを自動挿入。
//  - 携帯 (070/080/090):     3-4-4   (例 090-1234-5678)
//  - フリーダイヤル (0120):  4-3-3   (例 0120-123-456)
//  - ナビダイヤル (0570):    4-3-3
//  - 東京・大阪 (03 / 06):    2-4-4   (例 03-1234-5678)
//  - その他市外局番:          3-3-4   (例 042-123-4567)
function formatJapanesePhone(input: string): string {
  const digits = input.replace(/[^0-9]/g, "").slice(0, 11);
  if (digits.length === 0) return "";

  // 携帯 11 桁
  if (/^0[789]0/.test(digits) && digits.length > 0) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  // フリーダイヤル / ナビダイヤル 10 桁 (4-3-3)
  if (/^(0120|0570|0800)/.test(digits)) {
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 10)}`;
  }
  // 東京 03 / 大阪 06 (2-4-4)
  if (/^0[36]/.test(digits)) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  // その他市外局番 (3-3-4)
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県",
  "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 住所フィールドは zipcloud で書き換えるため controlled に
  const [postalCode, setPostalCode] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [zipStatus, setZipStatus] = useState<ZipStatus>("idle");
  const lastLookupRef = useRef<string>("");
  // 電話番号は入力中にハイフンを自動挿入するため controlled に
  const [phone, setPhone] = useState("");

  const handlePostalChange = useCallback(async (raw: string) => {
    setPostalCode(raw);
    const digits = raw.replace(/[^0-9]/g, "");
    if (digits.length !== 7) {
      if (zipStatus !== "idle") setZipStatus("idle");
      return;
    }
    if (lastLookupRef.current === digits) return;  // 同じ値の二重呼び出し防止
    lastLookupRef.current = digits;
    setZipStatus("loading");
    try {
      const result = await lookupZipcloud(digits);
      if (!result) {
        setZipStatus("not_found");
        return;
      }
      setPrefecture(result.address1);
      setCity(result.address2);
      setAddressLine1(result.address3);
      setZipStatus("ok");
    } catch {
      setZipStatus("error");
    }
  }, [zipStatus]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const input: RegisterInput = {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      displayName: String(fd.get("displayName") ?? ""),
      lastNameKanji: String(fd.get("lastNameKanji") ?? "") || undefined,
      firstNameKanji: String(fd.get("firstNameKanji") ?? "") || undefined,
      lastNameKana: String(fd.get("lastNameKana") ?? "") || undefined,
      firstNameKana: String(fd.get("firstNameKana") ?? "") || undefined,
      birthDate: String(fd.get("birthDate") ?? "") || undefined,
      gender: (String(fd.get("gender") ?? "") || undefined) as RegisterInput["gender"],
      phone: String(fd.get("phone") ?? "") || undefined,
      postalCode: String(fd.get("postalCode") ?? "") || undefined,
      prefecture: String(fd.get("prefecture") ?? "") || undefined,
      city: String(fd.get("city") ?? "") || undefined,
      addressLine1: String(fd.get("addressLine1") ?? "") || undefined,
      addressLine2: String(fd.get("addressLine2") ?? "") || undefined,
      agreedToTerms: fd.get("agreedToTerms") === "on",
    };

    const result = await registerAction(input);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push("/wallet");
    router.refresh();
  }

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-kuroko mb-2">アカウントを作成</h1>
      <p className="text-sm text-[#9890A8] mb-6">
        ご登録いただくと、知能資産の出品・購入・ロイヤリティ受領ができるようになります。
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* ── ログイン情報 ─────────────────────────────────────── */}
        <fieldset className="section-card p-5 space-y-4">
          <legend className="text-sm font-bold text-kuroko">ログイン情報</legend>

          <Field label="メールアドレス" required>
            <input
              type="email" name="email" required autoComplete="email"
              className="input-base"
              placeholder="you@example.com"
            />
          </Field>

          <Field label="パスワード" required hint="8文字以上">
            <input
              type="password" name="password" required minLength={8} autoComplete="new-password"
              className="input-base"
              placeholder="••••••••"
            />
          </Field>

          <Field label="表示名（公開されます）" required>
            <input
              type="text" name="displayName" required maxLength={40}
              className="input-base"
              placeholder="例: 田中太郎"
            />
          </Field>
        </fieldset>

        {/* ── 個人情報（基本） ─────────────────────────────────── */}
        <fieldset className="section-card p-5 space-y-4">
          <legend className="text-sm font-bold text-kuroko">基本情報（任意）</legend>

          <div className="grid grid-cols-2 gap-3">
            <Field label="姓（漢字）">
              <input type="text" name="lastNameKanji" autoComplete="family-name" className="input-base" placeholder="田中" />
            </Field>
            <Field label="名（漢字）">
              <input type="text" name="firstNameKanji" autoComplete="given-name" className="input-base" placeholder="太郎" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="姓（カナ）">
              <input type="text" name="lastNameKana" className="input-base" placeholder="タナカ" pattern="[ァ-ヴー\s]*" />
            </Field>
            <Field label="名（カナ）">
              <input type="text" name="firstNameKana" className="input-base" placeholder="タロウ" pattern="[ァ-ヴー\s]*" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="生年月日">
              <input type="date" name="birthDate" autoComplete="bday" className="input-base" />
            </Field>
            <Field label="性別">
              <select name="gender" className="input-base">
                <option value="">選択しない</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
                <option value="prefer_not_to_say">回答しない</option>
              </select>
            </Field>
          </div>

          <Field label="電話番号" hint="数字のみで入力 — ハイフンは自動">
            <input
              type="tel" name="phone"
              value={phone}
              onChange={(e) => setPhone(formatJapanesePhone(e.target.value))}
              autoComplete="tel" className="input-base"
              placeholder="09012345678"
              inputMode="numeric"
              maxLength={13}
            />
          </Field>
        </fieldset>

        {/* ── 住所（任意） ──────────────────────────────────── */}
        <fieldset className="section-card p-5 space-y-4">
          <legend className="text-sm font-bold text-kuroko">住所（任意）</legend>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="郵便番号"
              hint="7桁入力で住所自動入力"
            >
              <input
                type="text" name="postalCode"
                value={postalCode}
                onChange={(e) => handlePostalChange(e.target.value)}
                autoComplete="postal-code" className="input-base"
                placeholder="1234567 または 123-4567"
                pattern="[0-9\-]*" maxLength={8}
                inputMode="numeric"
                aria-describedby="zip-status"
              />
              <ZipStatusIndicator status={zipStatus} />
            </Field>
            <Field label="都道府県">
              <select
                name="prefecture"
                value={prefecture}
                onChange={(e) => setPrefecture(e.target.value)}
                autoComplete="address-level1"
                className="input-base"
              >
                <option value="">選択してください</option>
                {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <Field label="市区町村">
            <input
              type="text" name="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2" className="input-base"
              placeholder="渋谷区"
            />
          </Field>

          <Field label="町名・番地">
            <input
              type="text" name="addressLine1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              autoComplete="address-line1" className="input-base"
              placeholder="神南1-2-3"
            />
          </Field>

          <Field label="建物名・部屋番号">
            <input type="text" name="addressLine2" autoComplete="address-line2" className="input-base" placeholder="〇〇マンション 101" />
          </Field>
        </fieldset>

        {/* ── 同意 ──────────────────────────────────── */}
        <fieldset className="section-card p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox" name="agreedToTerms" required
              className="mt-1 h-4 w-4 rounded border-kuroko/30 text-kaki focus:ring-kaki"
            />
            <span className="text-sm text-kuroko">
              <strong>利用規約</strong>および<strong>プライバシーポリシー</strong>に同意します（必須）
            </span>
          </label>
        </fieldset>

        {error && (
          <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link href="/login" className="text-sm text-kaki underline">
            既にアカウントをお持ちの方はこちら
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary !py-3 !px-6 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "登録中…" : "アカウントを作成する"}
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({ label, children, hint, required }: {
  label: string; children: React.ReactNode; hint?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-[#3A3664] mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
        {hint && <span className="font-normal text-[#9890A8] ml-2">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function ZipStatusIndicator({ status }: { status: ZipStatus }) {
  if (status === "idle") return null;
  const map: Record<Exclude<ZipStatus, "idle">, { color: string; text: string }> = {
    loading:   { color: "text-kaki",         text: "🔍 住所を検索中…" },
    ok:        { color: "text-accent-green", text: "✓ 住所を自動入力しました" },
    not_found: { color: "text-amber-600",    text: "⚠ 該当する住所が見つかりません（手入力してください）" },
    error:     { color: "text-red-600",      text: "✗ 検索に失敗しました（手入力してください）" },
  };
  const { color, text } = map[status];
  return (
    <p id="zip-status" role="status" className={`mt-1 text-xs ${color}`}>
      {text}
    </p>
  );
}
