"use client";

import { PRIX_REFERENCE, formatFcfa, formatEuros } from "@/lib/prix-btp";

interface SuperCalculateurProps {
  surface: number;
  largeur?: number;
  longueur?: number;
  chambres: number;
  sallesDeBain: number;
  etages: number;
  garage: boolean;
  placesGarage?: number;
  piscine: boolean;
  jardin: boolean;
  surfaceJardin?: number;
  standing: 'economique' | 'moyen' | 'haut_standing' | 'luxe';
  style: string;
  mode?: 'complet' | 'widget' | 'suivi';
  budgetDepense?: number;
}

export default function SuperCalculateur({
  surface,
  largeur,
  longueur,
  chambres,
  sallesDeBain,
  etages,
  garage,
  placesGarage = 1,
  piscine,
  jardin,
  surfaceJardin = 50,
  standing,
  style,
  mode = "complet",
  budgetDepense = 0,
}: SuperCalculateurProps) {
  // Calcul du prix de base
  const prixBase = surface * PRIX_REFERENCE.standing[standing];

  // Application du coefficient de style
  const styleKey = style.toLowerCase() as keyof typeof PRIX_REFERENCE.style_coefficient;
  const coeffStyle = PRIX_REFERENCE.style_coefficient[styleKey] || 1.0;
  const prixAjusteStyle = prixBase * coeffStyle;

  // Ajustement pour les étages
  let prixEtages = prixAjusteStyle;
  if (etages > 1) {
    for (let i = 1; i < etages; i++) {
      prixEtages += prixAjusteStyle * PRIX_REFERENCE.supplements.etage_supplementaire;
    }
  }

  // Suppléments optionnels
  let supplements = 0;
  if (garage) supplements += placesGarage * PRIX_REFERENCE.supplements.garage;
  if (piscine) supplements += PRIX_REFERENCE.supplements.piscine;
  if (jardin) supplements += Math.ceil((surfaceJardin || 50) / 50) * PRIX_REFERENCE.supplements.jardin;

  // Total
  const total = prixEtages + supplements;

  // Répartition
  const grosOeuvre = total * PRIX_REFERENCE.repartition.gros_oeuvre;
  const finitions = total * PRIX_REFERENCE.repartition.finitions;
  const mainOeuvre = total * PRIX_REFERENCE.repartition.main_oeuvre;
  const divers = total * PRIX_REFERENCE.repartition.divers_imprevus;

  // Pour mode suivi
  const pourcentageDepense = budgetDepense ? Math.min(100, (budgetDepense / total) * 100) : 0;

  if (mode === "widget") {
    return (
      <div className="rounded-[24px] bg-white/10 backdrop-blur-xl p-6 border border-white/20">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🧮</span>
          <h3 className="text-sm font-bold text-white">Estimation rapide</h3>
        </div>
        <p className="text-xs text-white/60 mb-2">⚠️ Estimation à 60% de précision</p>
        <div className="mb-3">
          <span className="text-2xl font-black text-white">{formatFcfa(total)}</span>
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <span className="text-white/80">🔨 Gros œuvre : {formatFcfa(Math.round(grosOeuvre / 1000))}k</span>
          <span className="text-white/80">🎨 Finitions : {formatFcfa(Math.round(finitions / 1000))}k</span>
        </div>
        <button
          onClick={() => window.location.href = '/simulation'}
          className="mt-4 w-full py-2 rounded-xl bg-gradient-to-b from-[#FF8C00] to-[#CC5500] font-bold text-white text-sm"
        >
          Voir le détail complet →
        </button>
      </div>
    );
  }

  if (mode === "suivi") {
    return (
      <div className="rounded-[24px] bg-white/10 backdrop-blur-xl p-6 border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">💰</span>
          <h3 className="text-sm font-bold text-white">Suivi du budget</h3>
        </div>
        <p className="text-xs text-white/60 mb-3">⚠️ Estimation à 60% de précision</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-white/60">Budget estimé</span>
            <span className="font-bold text-white">{formatFcfa(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Dépensé</span>
            <span className="font-bold text-white">{formatFcfa(budgetDepense)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Restant</span>
            <span className="font-bold text-white">{formatFcfa(total - budgetDepense)}</span>
          </div>
        </div>

        <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-[#FF6B00] to-[#22C55E] rounded-full transition-all"
            style={{ width: `${pourcentageDepense}%` }}
          />
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-white/60 w-20">🔨 Gros œuvre</span>
            <div className="flex-1 h-1.5 bg-white/20 rounded-full">
              <div className="h-full bg-[#FF6B00] rounded-full w-[55%]" />
            </div>
            <span className="text-white/80 w-12 text-right">55%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60 w-20">🎨 Finitions</span>
            <div className="flex-1 h-1.5 bg-white/20 rounded-full">
              <div className="h-full bg-[#4B8FFF] rounded-full w-[25%]" />
            </div>
            <span className="text-white/80 w-12 text-right">25%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60 w-20">👷 Main d'œuvre</span>
            <div className="flex-1 h-1.5 bg-white/20 rounded-full">
              <div className="h-full bg-[#34D399] rounded-full w-[15%]" />
            </div>
            <span className="text-white/80 w-12 text-right">15%</span>
          </div>
        </div>
      </div>
    );
  }

  // Mode complet
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] bg-white/10 backdrop-blur-xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🧮</span>
          <h2 className="text-xl font-black text-white">SUPER CALCULATEUR BTP</h2>
        </div>
        <p className="text-xs text-white/60">⚠️ Estimation à 60% de précision</p>

        {/* Estimation globale */}
        <div className="mt-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-[#FF8C00]/20 to-[#CC5500]/20 border border-white/20">
          <p className="text-sm font-bold text-white/80 mb-2">💰 ESTIMATION GLOBALE</p>
          <p className="text-3xl font-black text-white">{formatFcfa(total)}</p>
          <p className="text-sm text-white/60">({formatEuros(total)})</p>
        </div>

        {/* Répartition du budget */}
        <div className="mb-4">
          <p className="text-sm font-bold text-white/80 mb-3">📊 RÉPARTITION DU BUDGET</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/80">🔨 Gros œuvre</span>
                <span className="font-bold text-white">{formatFcfa(Math.round(grosOeuvre))}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full">
                <div className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] rounded-full transition-all" style={{ width: '55%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/80">🎨 Finitions</span>
                <span className="font-bold text-white">{formatFcfa(Math.round(finitions))}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full">
                <div className="h-full bg-gradient-to-r from-[#4B8FFF] to-[#22C55E] rounded-full transition-all" style={{ width: '25%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/80">👷 Main d'œuvre</span>
                <span className="font-bold text-white">{formatFcfa(Math.round(mainOeuvre))}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full">
                <div className="h-full bg-gradient-to-r from-[#34D399] to-[#059669] rounded-full transition-all" style={{ width: '15%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/80">📦 Divers/Imprévus</span>
                <span className="font-bold text-white">{formatFcfa(Math.round(divers))}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full">
                <div className="h-full bg-gradient-to-r from-[#F59E0B] to-[#FCD34D] rounded-full transition-all" style={{ width: '5%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Détails */}
        <div className="mb-4">
          <p className="text-sm font-bold text-white/80 mb-3">📝 DÉTAILS</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/10 p-3 rounded-xl">
              <span className="text-white/60">Surface :</span>
              <span className="font-bold text-white ml-2">{surface} m²</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <span className="text-white/60">Standing :</span>
              <span className="font-bold text-white ml-2 capitalize">{standing}</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <span className="text-white/60">Étages :</span>
              <span className="font-bold text-white ml-2">{etages}</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <span className="text-white/60">Chambres :</span>
              <span className="font-bold text-white ml-2">{chambres}</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <span className="text-white/60">SdB :</span>
              <span className="font-bold text-white ml-2">{sallesDeBain}</span>
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <span className="text-white/60">Style :</span>
              <span className="font-bold text-white ml-2 capitalize">{style}</span>
            </div>
            {garage && (
              <div className="bg-white/10 p-3 rounded-xl">
                <span className="text-white/60">Garage :</span>
                <span className="font-bold text-white ml-2">{placesGarage} place(s)</span>
              </div>
            )}
            {piscine && (
              <div className="bg-white/10 p-3 rounded-xl">
                <span className="text-white/60">Piscine :</span>
                <span className="font-bold text-white ml-2">Oui</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-center text-white/60">
          ⚠️ Cette estimation est indicative.<br />
          Un devis précis sera établi par nos experts.
        </p>

        <button
          onClick={() => {
            const link = document.createElement('a');
            link.download = 'estimation-btp-detail.pdf';
            link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(`Estimation BTP\nTotal: ${formatFcfa(total)}\nGros œuvre: ${formatFcfa(Math.round(grosOeuvre))}\nFinitions: ${formatFcfa(Math.round(finitions))}`);
            link.click();
          }}
          className="mt-4 w-full py-3 rounded-xl bg-gradient-to-b from-[#FF8C00] to-[#CC5500] font-bold text-white flex items-center justify-center gap-2"
        >
          📥 Télécharger le détail PDF
        </button>
      </div>
    </div>
  );
}