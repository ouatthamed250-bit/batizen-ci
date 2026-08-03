"use client";

import { formatFcfa } from "@/utils/currency";
import { formatDateFr } from "@/utils/formatDate";
import dynamic from "next/dynamic";

const SuperCalculateur = dynamic(() => import("@/components/btp/SuperCalculateur"), { ssr: false });

interface ChantierResumeProps {
  chantier: any;
  nom: string;
  pct: number;
  totalPaye: number;
}

function formatLocalisation(loc: any, fallbackAdresse?: string): string {
  if (!loc) return fallbackAdresse || "—";
  if (typeof loc === "string") return loc;
  const parts: string[] = [];
  if (loc.ville) parts.push(loc.ville);
  if (loc.commune) parts.push(loc.commune);
  if (loc.quartier) parts.push(loc.quartier);
  const base = parts.join(", ");
  if (loc.adresse) return base ? `${base} - ${loc.adresse}` : loc.adresse;
  return base || fallbackAdresse || "—";
}


export function ChantierResume({ chantier, nom, pct, totalPaye }: ChantierResumeProps) {
  return (
    <section aria-label="Résumé">
      <div className="space-y-4 w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl">
        <h2 className="text-lg font-black text-[#0D2B6B]">Résumé du projet</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><p className="text-xs font-bold text-[#6B7280]">Nom du projet</p><p className="text-sm font-black text-[#0D2B6B]">{chantier?.nom_projet || chantier?.nom || "—"}</p></div>
          <div><p className="text-xs font-bold text-[#6B7280]">Type</p><p className="text-sm font-black text-[#0D2B6B]">{chantier?.type || "—"}</p></div>
          <div><p className="text-xs font-bold text-[#6B7280]">Localisation</p><p className="text-sm font-black text-[#0D2B6B]">{formatLocalisation(chantier?.localisation, chantier?.adresse)}</p></div>
          <div><p className="text-xs font-bold text-[#6B7280]">Budget total</p><p className="text-sm font-black text-[#0D2B6B]">{chantier?.budget ? formatFcfa(chantier.budget) : "—"}</p></div>
          <div><p className="text-xs font-bold text-[#6B7280]">Plan choisi</p><p className="text-sm font-black text-[#0D2B6B]">{chantier?.plan_choisi || "—"}</p></div>
          <div><p className="text-xs font-bold text-[#6B7280]">Délai</p><p className="text-sm font-black text-[#0D2B6B]">{chantier?.delai || "—"}</p></div>
          <div><p className="text-xs font-bold text-[#6B7280]">Date de création</p><p className="text-sm font-black text-[#0D2B6B]">{formatDateFr(chantier?.date_creation)}</p></div>
          {chantier?.dateActivation && <div><p className="text-xs font-bold text-[#6B7280]">Date d activation</p><p className="text-sm font-black text-[#0D2B6B]">{formatDateFr(new Date(chantier.dateActivation).toISOString())}</p></div>}
          {chantier?.statut === "termine" && <div><p className="text-xs font-bold text-[#6B7280]">Date de fin</p><p className="text-sm font-black text-[#0D2B6B]">{formatDateFr(chantier?.date_fin)}</p></div>}
          <div><p className="text-xs font-bold text-[#6B7280]">Progression globale</p><p className="text-sm font-black text-[#0D2B6B]">{pct}%</p></div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-4">
          {chantier?.date_debut && <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-[#6B7280]">Date de début prévue</p><p className="text-sm font-black text-[var(--navy)]">{formatDateFr(chantier.date_debut)}</p></div>}
          {chantier?.date_fin && <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-[#6B7280]">Date de fin prévue</p><p className="text-sm font-black text-[var(--navy)]">{formatDateFr(chantier.date_fin)}</p></div>}
        </div>
      </div>
      {chantier?.budget && (
        <SuperCalculateur
          surface={Number(chantier?.surface) || 150}
          chambres={Number(chantier?.chambres) || 3}
          sallesDeBain={Number(chantier?.sallesDeBain) || 2}
          etages={Number(chantier?.etages) || 1}
          garage={false}
          piscine={false}
          jardin={false}
          standing="moyen"
          style="Moderne"
          mode="suivi"
          budgetDepense={totalPaye}
        />
      )}
    </section>
  );
}