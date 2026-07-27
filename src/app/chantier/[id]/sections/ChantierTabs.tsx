"use client";

import type { LucideIcon } from "lucide-react";

export interface TabDef {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface ChantierTabsProps {
  tabs: TabDef[];
  affichableTabs: readonly string[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function ChantierTabs({ tabs, affichableTabs, activeTab, onTabChange }: ChantierTabsProps) {
  return (
    <div className="sticky top-0 z-20 border-b border-white/20 bg-white/90 backdrop-blur">
      <div className="flex w-full gap-1 overflow-x-auto px-2 py-2">
        {tabs.map((t) => {
          const isVisible = affichableTabs.includes(t.key);
          const isLocked = !isVisible;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTabChange(t.key)}
              disabled={isLocked}
              title={isLocked ? "Disponible après activation du chantier" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black transition ${
                activeTab === t.key
                  ? "bg-[#0D2B6B] text-white shadow"
                  : isLocked
                  ? "cursor-not-allowed bg-[#F3F4F6] text-[#9CA3AF]"
                  : "bg-white text-[#6B7280] hover:text-[#0D2B6B]"
              }`}
            >
              <t.icon size={15} aria-hidden={true} />
              {t.label}
              {isLocked && <span className="text-[10px]">🔒</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}