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
        <p className="text-white/50">Complétez les informations du chantier pour obtenir un devis estimatif.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] bg-white/5 border border-white/10 p-6">
      <h3 className="font-black text-white mb-4 text-lg">📋 Devis estimatif</h3>
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2 text-xs font-bold text-white/60 pb-2 border-b border-white/10">
          <span>Poste</span>
          <span className="text-right">Qté</span>
          <span className="text-right">Prix unit.</span>
          <span className="text-right">Total</span>
        </div>
        {estimation.details.map((d, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 text-sm text-white py-1 border-b border-white/5">
            <span className="truncate">{d.poste}</span>
            <span className="text-right text-white/60">{d.quantite} {d.unite}</span>
            <span className="text-right text-white/60">{formatFcfa(d.prixUnitaire)}</span>
            <span className="text-right font-bold">{formatFcfa(d.total)}</span>
          </div>
        ))}
        <div className="grid grid-cols-4 gap-2 text-sm pt-3 border-t border-white/20">
          <span className="font-black text-[#FF7A00]">TOTAL ESTIMÉ</span>
          <span />
          <span />
          <span className="text-right font-black text-[#FF7A00] text-lg">{formatFcfa(estimation.total)}</span>
        </div>
      </div>
      <p className="mt-4 text-[10px] text-white/40">Montant indicatif basé sur les prix BTP Côte d'Ivoire. Le montant final sera précisé après visite technique.</p>
    </div>
  );
}