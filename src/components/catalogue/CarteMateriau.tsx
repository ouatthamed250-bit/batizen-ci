"use client";

import { useState } from "react";
import type { Materiau } from "@/data/materiaux";

interface CarteMateriauProps {
  materiau: Materiau;
  index: number;
  onAjouter: (materiau: Materiau) => void;
  estDansPanier: boolean;
}

function formatPrix(prix: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(prix);
}

export default function CarteMateriau({ materiau, index, onAjouter, estDansPanier }: CarteMateriauProps) {
  const [clicked, setClicked] = useState(false);

  const handleAjouter = () => {
    onAjouter(materiau);
    setClicked(true);
    setTimeout(() => setClicked(false), 1200);
  };

  return (
    <div
      className="group relative h-[400px] w-full max-w-[300px]"
      style={{ animation: `cardAppear 0.5s ease ${0.04 * (index + 1)}s both` }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-[18px] bg-white shadow-[0_5px_20px_rgba(0,0,0,0.12)] transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-[0_15px_40px_rgba(0,0,0,0.25)]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Image */}
        <div className="relative h-[200px] w-full overflow-hidden">
          <img
            src={materiau.image}
            alt={materiau.nom}
            className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Badge icône catégorie */}
          <span className="absolute top-3 left-3 grid size-10 place-items-center rounded-xl bg-white/90 text-lg shadow-lg backdrop-blur-md">
            {materiau.icone}
          </span>

          {/* Badge disponibilité */}
          <span
            className={`absolute top-3 right-3 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md ${
              materiau.stock === "en_stock"
                ? "bg-[#22C55E]/90 text-white"
                : "bg-[#FF7A00]/90 text-white"
            }`}
          >
            {materiau.stock === "en_stock" ? "En stock" : "Sur commande"}
          </span>
        </div>

        {/* Contenu */}
        <div className="flex flex-col p-4">
          <h3 className="text-base font-bold leading-tight text-[#1a1a1a]">{materiau.nom}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#666] line-clamp-2">{materiau.description}</p>

          {/* Prix + Unité */}
          <div className="mt-auto flex items-end justify-between pt-3">
            <div>
              <span className="text-xl font-black text-[#FF6B00]">{formatPrix(materiau.prix)}</span>
              <span className="ml-1 text-[11px] font-medium text-[#999]">/{materiau.unite}</span>
            </div>
          </div>

          {/* Bouton Ajouter */}
          <button
            onClick={handleAjouter}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-sm font-bold text-white transition-all duration-300 ${
              clicked
                ? "scale-[0.98] bg-[#22C55E] shadow-[0_4px_15px_rgba(34,197,94,0.4)]"
                : estDansPanier
                  ? "bg-[#6B7280]"
                  : "bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] shadow-[0_4px_15px_rgba(255,107,0,0.3)] hover:scale-[1.03] hover:shadow-[0_6px_20px_rgba(255,107,0,0.45)] active:scale-[0.97]"
            }`}
          >
            {clicked ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Ajouté !
              </>
            ) : estDansPanier ? (
              "Déjà dans le devis"
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                Ajouter au devis
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes cardAppear {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}