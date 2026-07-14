"use client";

import { useState, useMemo, useCallback } from "react";
import { materiauxData, categories, Materiau } from "@/data/materiaux";
import CarteMateriau from "@/components/catalogue/CarteMateriau";
import PanierCatalogue from "@/components/catalogue/PanierCatalogue";
import { PHOTOS_CHANTIER } from "@/data/photos-chantier";
import BtpPageBackground from "@/components/btp/BtpPageBackground";

type Tri = "defaut" | "prix-croissant" | "prix-decroissant" | "nom";

export default function CatalogueMateriauxPage() {
  const [categorieActive, setCategorieActive] = useState<string>("toutes");
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState<Tri>("defaut");
  const [panier, setPanier] = useState<Materiau[]>([]);
  const [panierOuvert, setPanierOuvert] = useState(false);

  // Filtrer et trier
  const materiauxFiltres = useMemo(() => {
    let result = [...materiauxData];

    // Filtre par catégorie
    if (categorieActive !== "toutes") {
      result = result.filter((m) => m.categorie === categorieActive);
    }

    // Filtre par recherche
    if (recherche.trim()) {
      const q = recherche.toLowerCase();
      result = result.filter(
        (m) =>
          m.nom.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }

    // Tri
    switch (tri) {
      case "prix-croissant":
        result.sort((a, b) => a.prix - b.prix);
        break;
      case "prix-decroissant":
        result.sort((a, b) => b.prix - a.prix);
        break;
      case "nom":
        result.sort((a, b) => a.nom.localeCompare(b.nom));
        break;
    }

    return result;
  }, [categorieActive, recherche, tri]);

  const idsPanier = useMemo(() => new Set(panier.map((p) => p.id)), [panier]);

  const ajouterAuPanier = useCallback((materiau: Materiau) => {
    setPanier((prev) => {
      if (prev.find((p) => p.id === materiau.id)) return prev;
      return [...prev, materiau];
    });
  }, []);

  const supprimerDuPanier = useCallback((id: string) => {
    setPanier((prev) => prev.filter((p) => p.id !== id));
  }, []);

  function formatPrix(prix: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(prix);
  }

  return (
    <BtpPageBackground imageUrl={PHOTOS_CHANTIER.materiaux} overlayClassName="bg-gradient-to-b from-black/50 via-black/60 to-black/75">
      <div className="min-h-screen bg-[#F5F5F5]/90">
        {/* ===== HEADER ===== */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#0D2B6B] via-[#0B5FFF] to-[#FF7A00] px-6 pb-8 pt-20">
        {/* Texture de fond */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.4'%3E%3Cpath d='M30 0l30 30-30 30L0 30z'/%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          <h1 className="text-3xl font-black text-white md:text-4xl">
            Catalogue de matériaux
          </h1>
          <p className="mt-2 text-base text-white/80">
            {materiauxFiltres.length} produit{materiauxFiltres.length > 1 ? "s" : ""} trouvé{materiauxFiltres.length > 1 ? "s" : ""}
          </p>

          {/* Barre de recherche */}
          <div className="relative mt-5">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un matériau..."
              className="h-[54px] w-full rounded-[16px] border-2 border-transparent bg-white/15 pl-12 pr-4 text-base font-bold text-white placeholder-white/40 outline-none transition-all focus:border-white/30 focus:bg-white/20"
            />
          </div>
        </div>
      </header>

      {/* ===== FILTRES + TRI ===== */}
      <section className="sticky top-0 z-50 border-b border-[#E7EBF5] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          {/* Filtres catégories (scrollable) */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setCategorieActive("toutes")}
              className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] transition-all ${
                categorieActive === "toutes"
                  ? "bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] text-white shadow-[0_4px_15px_rgba(255,107,0,0.3)]"
                  : "bg-[#F7F9FC] text-[#6B7280] hover:bg-[#EAF2FF]"
              }`}
            >
              Tout
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategorieActive(cat.id)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] transition-all ${
                  categorieActive === cat.id
                    ? "bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] text-white shadow-[0_4px_15px_rgba(255,107,0,0.3)]"
                    : "bg-[#F7F9FC] text-[#6B7280] hover:bg-[#EAF2FF]"
                }`}
              >
                {cat.icone} {cat.nom}
              </button>
            ))}
          </div>

          {/* Tri + Compteur */}
          <div className="mt-3 flex items-center justify-between">
            <select
              value={tri}
              onChange={(e) => setTri(e.target.value as Tri)}
              className="rounded-[12px] border-2 border-[#E7EBF5] bg-white px-4 py-2.5 text-sm font-bold text-[#6B7280] outline-none transition-all focus:border-[#FF6B00]"
            >
              <option value="defaut">Tri par défaut</option>
              <option value="prix-croissant">Prix croissant</option>
              <option value="prix-decroissant">Prix décroissant</option>
              <option value="nom">Nom A-Z</option>
            </select>

            {/* Compteur panier */}
            <button
              onClick={() => setPanierOuvert(true)}
              className="group relative flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_15px_rgba(255,107,0,0.25)] transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
              Devis
              {panier.length > 0 && (
                <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-white text-xs font-black text-[#FF6B00] shadow-md animate-bounceIn">
                  {panier.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ===== GRILLE DE PRODUITS ===== */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        {materiauxFiltres.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl">🔍</span>
            <h3 className="mt-6 text-xl font-bold text-[#1a1a1a]">Aucun matériau trouvé</h3>
            <p className="mt-2 text-sm text-[#6B7280]">
              Essayez de modifier votre recherche ou vos filtres.
            </p>
            <button
              onClick={() => {
                setRecherche("");
                setCategorieActive("toutes");
              }}
              className="mt-6 rounded-[12px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_15px_rgba(255,107,0,0.3)] transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {materiauxFiltres.map((materiau, index) => (
              <CarteMateriau
                key={materiau.id}
                materiau={materiau}
                index={index}
                onAjouter={ajouterAuPanier}
                estDansPanier={idsPanier.has(materiau.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ===== PANIER LATÉRAL ===== */}
      <PanierCatalogue
        ouvert={panierOuvert}
        onFermer={() => setPanierOuvert(false)}
        articles={panier}
        onSupprimer={supprimerDuPanier}
      />
      </div>
    </BtpPageBackground>
  );
}
