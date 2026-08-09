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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-white/10 rounded-xl">
      <p className="text-xs font-bold text-gray-500 dark:text-white/60">{label}</p>
      <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}

export function ChantierResume({ chantier, nom, pct, totalPaye }: ChantierResumeProps) {
  return (
    <section aria-label="Résumé" className="space-y-4">
      <div className="w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl">
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Résumé du projet</h2>
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Nom du projet" value={chantier?.nom_projet || chantier?.nom || "—"} />
          <InfoCard label="Type" value={chantier?.type || "—"} />
          <InfoCard label="Localisation" value={formatLocalisation(chantier?.localisation, chantier?.adresse)} />
          <InfoCard label="Budget total" value={chantier?.budget ? formatFcfa(chantier.budget) : "—"} />
          <InfoCard label="Plan choisi" value={chantier?.planChoisi || chantier?.plan_choisi || "—"} />
          <InfoCard label="Délai" value={chantier?.delai || "—"} />
          <InfoCard label="Date de création" value={formatDateFr(chantier?.date_creation || (chantier?.dateCreation ? new Date(chantier.dateCreation).toISOString() : undefined))} />
          {chantier?.dateActivation && (
            <InfoCard label="Date d'activation" value={formatDateFr(new Date(chantier.dateActivation).toISOString())} />
          )}
          {chantier?.statut === "termine" && (
            <InfoCard label="Date de fin" value={formatDateFr(chantier?.date_fin)} />
          )}
          <InfoCard label="Progression globale" value={`${pct}%`} />
          {(chantier?.date_debut || chantier?.dateDebut) && (
            <InfoCard label="Date de début prévue" value={formatDateFr(chantier.date_debut || chantier.dateDebut)} />
          )}
          {chantier?.date_fin && (
            <InfoCard label="Date de fin prévue" value={formatDateFr(chantier.date_fin)} />
          )}
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