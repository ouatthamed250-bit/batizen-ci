"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LockedTab } from "@/components/ui/LockedTab";
import { formatDateFr } from "@/utils/formatDate";
import { etapeIcon, etapeLabel, etapeColor } from "@/utils/chantier-helpers";

interface ChantierPlanningProps {
  planning: any[];
  isTabLocked: boolean;
}

export function ChantierPlanning({ planning, isTabLocked }: ChantierPlanningProps) {
  if (isTabLocked) return <LockedTab />;
  if (planning.length === 0) return <EmptyState text="Aucune planification disponible" />;

  return (
    <div className="relative space-y-4 pl-2">
      {planning.map((e, i) => (
        <div key={e.id} className="relative rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl">
          <div className="flex items-start gap-3">
            {etapeIcon(e.statut)}
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-black text-[#0D2B6B]">{e.nom || e.titre || `Étape ${i + 1}`}</h3>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black text-white" style={{ backgroundColor: etapeColor(e.statut) }}>{etapeLabel(e.statut)}</span>
              </div>
              {e.date && <p className="mt-0.5 text-xs text-[#6B7280]">📅 {formatDateFr(e.date)}</p>}
              {e.description && <p className="mt-2 text-sm text-[#374151]">{e.description}</p>}
              <div className="mt-3"><ProgressBar value={Number(e.pourcentage ?? 0)} label="Avancement" /></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}