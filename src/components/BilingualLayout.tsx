"use client";
import { useState } from "react";

interface BilingualLayoutProps {
  emotionalContent: React.ReactNode;
  specContent: React.ReactNode;
}

export function BilingualLayout({ emotionalContent, specContent }: BilingualLayoutProps) {
  const [activeTab, setActiveTab] = useState<"yasashii" | "kuwashii">("yasashii");

  const yasashiiId = "bilingual-tab-yasashii";
  const kuwashiiId = "bilingual-tab-kuwashii";
  const panelId = "bilingual-panel";

  return (
    <>
      {/* Mobile: 2 tabs */}
      <div className="md:hidden">
        <div role="tablist" className="flex border-b border-white/10 mt-4">
          <button
            id={yasashiiId}
            role="tab"
            aria-selected={activeTab === "yasashii"}
            aria-controls={panelId}
            onClick={() => setActiveTab("yasashii")}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${activeTab === "yasashii" ? "border-b-2 border-kaki text-kaki" : "text-slate-400"}`}
          >
            やさしい説明
          </button>
          <button
            id={kuwashiiId}
            role="tab"
            aria-selected={activeTab === "kuwashii"}
            aria-controls={panelId}
            onClick={() => setActiveTab("kuwashii")}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${activeTab === "kuwashii" ? "border-b-2 border-kaki text-kaki" : "text-slate-400"}`}
          >
            くわしい仕様
          </button>
        </div>
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={activeTab === "yasashii" ? yasashiiId : kuwashiiId}
          className="mt-4"
        >
          {activeTab === "yasashii" ? emotionalContent : specContent}
        </div>
      </div>

      {/* Desktop: 2-column */}
      <div className="hidden md:grid md:grid-cols-[3fr_2fr] gap-6 mt-4">
        <div>{emotionalContent}</div>
        <div>{specContent}</div>
      </div>
    </>
  );
}
