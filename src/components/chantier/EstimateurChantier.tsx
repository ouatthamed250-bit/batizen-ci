"use client";
import { useMemo } from "react";
import { estimerCoutChantier, type PosteBTP } from "@/lib/prix-btp";
import { formatFcfa } from "@/utils/currency";

interface EstimateurChantierProps {
  surface?: number;
  type?: string;
  materiaux?: Record<string, any>;
}

export function EstimateurChantier({ surface, type, materiaux }: EstimateurChantierProps) {
  const estimation = useMemo(() => {
    if (!surface || surface < 20) return null;
    return estimerCoutChantier(surface, type || "standard", materiaux);
  }, [surface, type, materiaux]);

  if (!estimation) {
    return (
      <div className="rounded-[20px] bg-white/5 border border-white/10 p-6 text-center">
        <p className="text-gray-500 dark:text-white/50">Complétez les informations du chantier pour obtenir un devis estimatif.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] bg-white/5 border border-white/10 p-6">
      <h3 className="font-black text-gray-900 dark:text-white mb-4 text-lg">📋 Devis estimatif</h3>
      <div className="space-y-3">
        {estimation.details.map((d, i) => (
          <div key={i} className="pb-2 border-b border-white/5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-gray-900 dark:text-white truncate">{d.poste}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white shrink-0">{formatFcfa(d.total)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-white/60 mt-0.5">{d.quantite} {d.unite} × {formatFcfa(d.prixUnitaire)}</p>
          </div>
        ))}
        <div className="flex items-center justify-between pt-3 border-t border-white/20">
          <span className="font-black text-[#FF7A00] text-sm">TOTAL ESTIMÉ</span>
          <span className="font-black text-[#FF7A00] text-lg">{formatFcfa(estimation.total)}</span>
        </div>
      </div>
      <p className="mt-4 text-[10px] text-gray-400 dark:text-white/40">Montant indicatif basé sur les prix BTP Côte d'Ivoire. Le montant final sera précisé après visite technique.</p>
    </div>
  );
}