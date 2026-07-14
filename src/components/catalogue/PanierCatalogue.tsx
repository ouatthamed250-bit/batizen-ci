"use client";

import type { Materiau } from "@/data/materiaux";

interface PanierCatalogueProps {
  ouvert: boolean;
  onFermer: () => void;
  articles: Materiau[];
  onSupprimer: (id: string) => void;
}

function formatPrix(prix: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(prix);
}

export default function PanierCatalogue({ ouvert, onFermer, articles, onSupprimer }: PanierCatalogueProps) {
  const total = articles.reduce((sum, a) => sum + a.prix, 0);

  return (
    <>
      {/* Overlay */}
      {ouvert && (
        <div
          className="fixed inset-0 z-[1500] bg-black/60 backdrop-blur-[4px]"
          onClick={onFermer}
        />
      )}

      {/* Panel latéral */}
      <div
        className="fixed right-0 top-0 z-[1501] flex h-screen w-[420px] max-w-full flex-col bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.15)] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: ouvert ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-6 py-5 text-white">
          <div>
            <h2 className="text-xl font-black">Votre devis</h2>
            <p className="text-sm text-white/80">{articles.length} article{articles.length > 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={onFermer}
            className="grid size-10 place-items-center rounded-xl bg-white/20 text-white transition-all duration-300 hover:rotate-90 hover:bg-white/30"
            aria-label="Fermer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {articles.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <span className="text-5xl">🛒</span>
                <p className="mt-4 font-bold text-[#6B7280]">Votre devis est vide</p>
                <p className="mt-1 text-sm text-[#999]">Ajoutez des matériaux depuis le catalogue</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="group flex items-center gap-4 rounded-[16px] bg-[#F7F9FC] p-4 transition-all hover:bg-[#EAF2FF]"
                >
                  {/* Image miniature */}
                  <div className="size-16 shrink-0 overflow-hidden rounded-[12px]">
                    <img
                      src={article.image}
                      alt={article.nom}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#1a1a1a] truncate">{article.nom}</h4>
                    <p className="mt-0.5 text-xs text-[#999]">{article.unite}</p>
                    <p className="mt-1 text-sm font-black text-[#FF6B00]">{formatPrix(article.prix)}</p>
                  </div>

                  {/* Supprimer */}
                  <button
                    onClick={() => onSupprimer(article.id)}
                    className="grid size-8 shrink-0 place-items-center rounded-[10px] text-[#999] transition-all hover:bg-red-100 hover:text-red-500"
                    aria-label={`Supprimer ${article.nom}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pied */}
        {articles.length > 0 && (
          <div className="border-t border-[#E7EBF5] px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-[#6B7280]">Total estimé</span>
              <span className="text-2xl font-black text-[#FF6B00]">{formatPrix(total)}</span>
            </div>
            <button
              onClick={() => alert("Demande de devis envoyée ! ✅")}
              className="w-full rounded-[14px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-6 py-4 text-base font-bold text-white shadow-[0_8px_25px_rgba(255,107,0,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_35px_rgba(255,107,0,0.5)] active:scale-[0.98]"
            >
              Demander le devis
            </button>
          </div>
        )}
      </div>
    </>
  );
}