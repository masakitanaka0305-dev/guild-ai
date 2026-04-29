"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { generateDeployUrl } from "@/lib/ownership";
import { useUserId } from "@/components/AuthProvider";
import type { OwnershipRecord } from "@/types";

interface Props {
  assetId: string;
  assetTitle: string;
  price: number;
}

export function PurchaseButton({ assetId, assetTitle, price }: Props) {
  const userId = useUserId();
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    try {
      const owned: OwnershipRecord[] = JSON.parse(
        localStorage.getItem("guild_owned_assets") ?? "[]"
      );
      setPurchased(owned.some((r) => r.assetId === assetId));
    } catch {
      // ignore
    }
  }, [assetId]);

  const handlePurchase = () => {
    try {
      const owned: OwnershipRecord[] = JSON.parse(
        localStorage.getItem("guild_owned_assets") ?? "[]"
      );
      const record: OwnershipRecord = {
        assetId,
        ownerId: userId,
        acquiredAt: new Date().toISOString(),
        deployUrl: generateDeployUrl(assetId),
        assetTitle,
      };
      const updated = [...owned.filter((r) => r.assetId !== assetId), record];
      localStorage.setItem("guild_owned_assets", JSON.stringify(updated));
      setPurchased(true);
    } catch {
      // ignore
    }
  };

  if (purchased) {
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
          ✓ 購入済み
        </span>
        <Link href="/dashboard" className="btn-secondary text-sm">
          Dashboard へ →
        </Link>
      </div>
    );
  }

  return (
    <button onClick={handlePurchase} className="btn-primary !py-3 !px-6 text-base">
      購入する ¥{price.toLocaleString("ja-JP")}
    </button>
  );
}
