"use client";

import Image from "next/image";
import { useState } from "react";
import { materiauxCI } from "@/constants/materiaux";
import { formatFcfa } from "@/utils/currency";
import { cn } from "@/lib/helpers";

type QualityKey = "eco" | "standard" | "premium";

export function MateriauSelector() {
  const [selectedQualities, setSelectedQualities] = useState<Record<string, QualityKey>>({});

  return (
    <div className="space-y-4">
      {materiauxCI.map((mat) => (
        <div
          key={mat.id}
          className="overflow-hidden rounded-[24px] border border-[#E7EBF5] bg-white shadow-[0_4px_16px_rgba(16,24,40,0.05)]"
        >
          <div className="flex items-center gap-4 border-b border-[#E7EBF5] p-4">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-[16px]">
              <Image alt={mat.name} className="object-cover" fill src={mat.image} sizes="56px" />
            </div>
            <div>
              <h3 className="font-bold text-[#111827]">{mat.name}</h3>
              <p className="text-sm text-[#6B7280]">{mat.unit}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-[#F7F9FC] p-3">
            {(["eco", "standard", "premium"] as const).map((qKey) => {
              const quality = mat.qualities[qKey];
              const isActive = selectedQualities[mat.id] === qKey;
              return (
                <button
                  key={qKey}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`${mat.name} — ${quality.label} : ${formatFcfa(quality.price)}`}
                  onClick={() => setSelectedQualities({ ...selectedQualities, [mat.id]: qKey })}
                  className={cn(
                    "flex flex-col items-center rounded-[14px] p-3 transition-all active:scale-95",
                    isActive
                      ? "bg-white shadow-md ring-2 ring-[#0B5FFF]"
                      : "hover:bg-white/60"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider",
                    isActive ? "text-[#0B5FFF]" : "text-[#6B7280]"
                  )}>
                    {quality.label}
                  </span>
                  <span className="mt-1 text-sm font-black text-[#0D2B6B]">
                    {formatFcfa(quality.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
