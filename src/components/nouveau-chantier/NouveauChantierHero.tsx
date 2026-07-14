"use client";

import type { ReactNode } from "react";

interface NouveauChantierHeroProps {
  onOpenFormulaire: () => void;
}

export default function NouveauChantierHero({ onOpenFormulaire }: NouveauChantierHeroProps) {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/85" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-[#FF6B00]">Service BATIZEN.CI</p>

        <h1
          className="mt-4 text-5xl font-black leading-tight text-white md:text-6xl"
          style={{ textShadow: "0 0 30px rgba(255,107,0,0.5), 0 0 60px rgba(255,107,0,0.2)" }}
        >
          Construisez avec des experts
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-xl font-semibold text-white/90">
          Nouveau chantier : étude terrain, conception et accompagnement BTP de A à Z.
        </p>

        <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
          Depuis l'analyse du terrain jusqu'au dépôt du dossier urbanistique, nos ingénieurs topographes et architectes sécurisent votre projet.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={onOpenFormulaire}
            className="inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-8 py-4 text-lg font-bold text-white shadow-[0_8px_25px_rgba(255,107,0,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_35px_rgba(255,107,0,0.5)] active:scale-[0.98]"
          >
            Demander une visite d'étude
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <span className="text-sm font-bold text-white/80">Forfait visite d'étude & faisabilité : 100 000 FCFA</span>
        </div>

        <div
          className="mt-10 flex flex-col items-center gap-2"
          style={{ animation: "heroFadeIn 1s ease-out 0.8s both" }}
        >
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">Déroulement conseillé</span>
          <div className="flex items-center gap-3 text-sm font-black text-white/90">
            <span>1. Visite terrain</span>
            <span className="text-[#FF6B00]">→</span>
            <span>2. Étude bureau</span>
            <span className="text-[#FF6B00]">→</span>
            <span>3. Transmission</span>
          </div>
        </div>
      </div>
    </section>
  );
}