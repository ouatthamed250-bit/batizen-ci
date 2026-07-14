"use client";

import { Chantier } from "@/data/chantiers";
import { chantiersData } from "@/data/chantiers";
import ChantierCard from "./ChantierCard";

interface ChantierGridProps {
  onSelectChantier: (chantier: Chantier) => void;
}

export default function ChantierGrid({ onSelectChantier }: ChantierGridProps) {
  return (
    <section className="relative z-10 px-6 md:px-12 lg:px-20 pb-20 -mt-20">
      {/* Titre de section */}
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-3">
          Mes chantiers
        </h2>
        <p className="text-[var(--muted)] text-lg max-w-xl mx-auto">
          Suivez l'avancement de vos projets de construction
        </p>
      </div>

      {/* Grille responsive */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px] justify-items-center">
        {chantiersData.map((chantier, index) => (
          <ChantierCard
            key={chantier.id}
            chantier={chantier}
            index={index}
            onSelect={onSelectChantier}
          />
        ))}
      </div>
    </section>
  );
}