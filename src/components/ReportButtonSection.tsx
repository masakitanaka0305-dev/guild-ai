"use client";

import { useState } from "react";
import { ReportModal } from "./ReportModal";

export function ReportButtonSection({ guildId }: { guildId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 flex justify-end">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[10px] text-[var(--n-muted,#6B6456)] hover:text-[var(--primary,#6366F1)] underline transition-colors"
      >
        不適切なコンテンツを報告
      </button>
      {open && <ReportModal guildId={guildId} onClose={() => setOpen(false)} />}
    </div>
  );
}
