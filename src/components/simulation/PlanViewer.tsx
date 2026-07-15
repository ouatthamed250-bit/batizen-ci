"use client";

import { HouseModel3D } from "@/components/simulation/HouseModel3D";

interface PlanViewerProps {
  visible: boolean;
  onClose: () => void;
  style: "Moderne" | "Classique" | "Africain" | "Contemporain";
  etages: number;
  largeur: number;
  longueur: number;
  proposition: string;
  onViewPaidPlans: () => void;
}

export function PlanViewer({
  visible,
  onClose,
  style,
  etages,
  largeur,
  longueur,
  proposition,
  onViewPaidPlans,
}: PlanViewerProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white/80 backdrop-blur-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-[#0D2B6B]">
            🏠 Plan de la proposition {proposition}
          </h2>
          <button
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full bg-[#F7F9FC] hover:bg-[#E7EBF5]"
          >
            ✕
          </button>
        </div>

        {/* Toggle Vue 2D / Vue 3D */}
        <div className="flex gap-2 mb-4">
          <span className="rounded-full bg-[#0D2B6B] px-4 py-2 text-xs font-bold text-white">
            Vue 3D
          </span>
          <span className="rounded-full bg-[#F7F9FC] px-4 py-2 text-xs font-bold text-[#6B7280]">
            Vue 2D
          </span>
        </div>

        {/* Modèle 3D */}
        <div className="rounded-2xl border border-[#E7EBF5] p-4 mb-6">
          <HouseModel3D style={style} etages={etages} largeur={largeur} longueur={longueur} />
        </div>

        {/* Avertissement */}
        <div className="rounded-[18px] bg-[#FFF7ED] border border-[#FFD6AE] p-4 mb-6">
          <p className="text-xs font-bold text-[#FF7A00]">
            ⚠️ Cette simulation est une estimation à 63% de précision. Les montants et dimensions sont indicatifs.
            Nos experts vous fourniront un devis précis lors du rendez-vous.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              alert("Chantier créé avec succès !");
              onClose();
            }}
            className="w-full bg-[#22C55E] text-white font-bold py-3 rounded-xl"
          >
            ✅ Créer ce chantier
          </button>
          <button
            onClick={onClose}
            className="w-full bg-[#F7F9FC] text-[#0D2B6B] font-bold py-3 rounded-xl"
          >
            🔄 Choisir une autre proposition
          </button>
          <button
            onClick={onViewPaidPlans}
            className="w-full bg-[#FF6B00] text-white font-bold py-3 rounded-xl"
          >
            💼 Voir les plans professionnels
          </button>
        </div>
      </div>
    </div>
  );
}