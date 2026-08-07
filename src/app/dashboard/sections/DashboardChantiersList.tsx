"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { HardHat, ChevronRight } from "lucide-react";
import type { Chantier } from "@/types/chantier";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatFcfa, formatLocalisation, formatDateCourte, getStatutLabel } from "@/utils/formatters";

function SkeletonChantier() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl w-full shadow-xl">
      <div className="h-40 w-full bg-white/10" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 rounded bg-white/20" /><div className="h-4 w-1/2 rounded bg-white/20" /><div className="h-10 w-full rounded-[20px] bg-white/20" />
      </div>
    </div>
  );
}

function ChantierCard({ chantier, onModifier, onSupprimer }: { chantier: Chantier; onModifier?: (id: string) => void; onSupprimer?: (id: string, statut: string) => void }) {
  const photo = (chantier as any).photo || (chantier as any).image_url;
  const nom = chantier.nom_projet || chantier.nom || "Chantier";
  const pct = Number((chantier as any).progression ?? (chantier as any).progress ?? 0);
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full overflow-hidden rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl shadow-xl">
      <div className="relative h-32 w-full bg-white/10">
        {photo ? <Image src={photo} alt={nom} fill className="object-cover" /> : <div className="grid size-full place-items-center text-white/60"><HardHat size={48} /></div>}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-gray-900 dark:text-white drop-shadow-md break-words text-lg">{nom}</h3>
          <span className="shrink-0 rounded-full px-3 py-1 text-[10px] font-black text-white bg-[#0B5FFF] shadow-md whitespace-nowrap">{getStatutLabel(chantier.statut)}</span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600 dark:text-white/80 drop-shadow-md"><HardHat size={14} /> {chantier.type || "—"} · {formatLocalisation(chantier.localisation)}</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-white/80 drop-shadow-md">💰 Budget : <span className="font-bold text-gray-900 dark:text-white">{formatFcfa(chantier.budget || 0)}</span></p>
        {chantier.statut === "en_cours" && <div className="mt-4"><ProgressBar value={pct} label="Progression" /></div>}
        {(chantier.statut === "en_attente" || chantier.statut === "en_attente_rdv") && (
          <div className="mt-4 space-y-2">
            {chantier.plan_choisi && <p className="text-sm text-gray-600 dark:text-white/80 drop-shadow-md">Plan : <span className="font-bold text-gray-900 dark:text-white break-words">{chantier.plan_choisi}</span></p>}
            {chantier.rdv_date && <p className="text-sm text-gray-600 dark:text-white/80 drop-shadow-md">📅 RDV : <span className="font-bold text-gray-900 dark:text-white">{formatDateCourte(chantier.rdv_date)}</span></p>}
          </div>
        )}
        {(chantier.statut === "termine" || chantier.statut === "terminé") && <p className="mt-4 text-sm text-gray-600 dark:text-white/80 drop-shadow-md">Terminé le : <span className="font-bold text-gray-900 dark:text-white">{formatDateCourte(chantier.date_fin)}</span></p>}
        <div className="mt-5 flex flex-col gap-3">
          <Link href={`/chantier/${chantier.id}`} className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#0B5FFF] to-[#0D2B6B] py-3.5 text-sm font-black text-white transition active:scale-95 shadow-lg">Voir détails <ChevronRight size={18} /></Link>
          {chantier.statut === "en_attente" && onModifier && onSupprimer && (
            <div className="flex gap-3">
              <button onClick={() => onModifier(chantier.id)} className="flex-1 rounded-[16px] bg-gray-200 dark:bg-white/20 py-3 text-sm font-bold text-gray-900 dark:text-white transition active:scale-95 shadow-lg">✏️ Modifier</button>
              <button onClick={() => onSupprimer(chantier.id, chantier.statut!)} className="flex-1 rounded-[16px] bg-red-500/30 py-3 text-sm font-bold text-white transition active:scale-95 shadow-lg">🗑️ Supprimer</button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function DashboardChantiersList({ chantiers, isAuthReady, loading, onModifier, onSupprimer }: { chantiers: any[]; isAuthReady: boolean; loading: boolean; onModifier?: (id: string) => void; onSupprimer?: (id: string, statut: string) => void }) {
  if (!isAuthReady) return <div className="flex items-center justify-center py-12 w-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]"></div><span className="ml-3 text-gray-700 dark:text-white font-bold">Chargement...</span></div>;
  if (loading) return <div className="space-y-4 w-full"><SkeletonChantier /><SkeletonChantier /></div>;
  return (
    <div className={`grid gap-3 w-full ${chantiers.length === 0 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
      <Link href="/nouveau-chantier" className={`flex flex-col items-center justify-center text-center gap-3 w-full overflow-hidden rounded-[28px] border-2 border-dashed border-white/50 bg-white/10 backdrop-blur-xl p-6 shadow-xl transition hover:bg-white/20 active:scale-95 ${chantiers.length === 0 ? 'max-w-sm mx-auto' : ''}`}>
        <div className="grid size-14 place-items-center rounded-[20px] bg-gradient-to-br from-[#FF7A00] to-[#D97706] text-white shadow-lg"><span className="text-2xl">🏗️</span></div>
        <p className="font-black text-gray-900 dark:text-white drop-shadow-md">Nouveau Chantier</p>
        <p className="text-xs text-gray-500 dark:text-white/70">Créer un nouveau projet</p>
      </Link>
      {chantiers.map((c) => <ChantierCard key={c.id} chantier={c} onModifier={onModifier} onSupprimer={onSupprimer} />)}
    </div>
  );
}