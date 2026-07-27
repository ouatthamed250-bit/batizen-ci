"use client";

import { CheckCircle2, RefreshCw, Clock } from "lucide-react";
import { type Variants } from "framer-motion";

export function etapeIcon(statut?: string) {
  const s = (statut || "").toLowerCase();
  switch (s) {
    case "termine": return <CheckCircle2 className="size-5 shrink-0 text-[#22C55E]" />;
    case "en_cours": return <RefreshCw className="size-5 shrink-0 animate-spin text-[#0B5FFF]" />;
    default: return <Clock className="size-5 shrink-0 text-[#9CA3AF]" />;
  }
}

export function etapeLabel(statut?: string): string {
  const s = (statut || "").toLowerCase();
  switch (s) { case "termine": return "Terminé"; case "en_cours": return "En cours"; default: return "À venir"; }
}

export function etapeColor(statut?: string): string {
  const s = (statut || "").toLowerCase();
  switch (s) { case "termine": return "#22C55E"; case "en_cours": return "#0B5FFF"; default: return "#9CA3AF"; }
}

export function rdvStatutBadge(statut?: string) {
  const s = (statut || "").toLowerCase();
  switch (s) {
    case "passe": return <span className="rounded-full bg-[#9CA3AF]/10 px-2 py-0.5 text-[10px] font-black text-[#9CA3AF]">Passé</span>;
    case "annule": return <span className="rounded-full bg-[#EF4444]/10 px-2 py-0.5 text-[10px] font-black text-[#EF4444]">Annulé</span>;
    default: return <span className="rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-black text-[#22C55E]">Planifié</span>;
  }
}

export const tabContentVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
};