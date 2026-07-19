"use client";

import { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, Clock, Hammer, Home, Palette } from "lucide-react";
import { ref, onValue, type Unsubscribe } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";

// Types pour les rapports
type Rapport = {
  id: string;
  chantierId?: string;
  semaine?: string;
  dateDebut?: string;
  dateFin?: string;
  etape?: string;
  avancement?: number;
  statut?: string;
  commentaires?: string;
  problemes?: string;
  prochaine_etape?: string;
  medias?: Array<{
    id: string;
    url: string;
    type: "photo" | "video";
    legende: string;
    categorie: "avant" | "pendant" | "apres";
    dateUpload: number;
  }>;
  creePar?: string;
  dateCreation?: number;
  actif?: boolean;
};

// Étapes de construction standard
const ETAPES_STANDARD = [
  { key: "fondations", label: "Fondations", icon: Hammer, color: "#1e3a8a" }, // Bleu marine
  { key: "murs", label: "Murs / Gros œuvre", icon: Home, color: "#1e3a8a" },
  { key: "toiture", label: "Toiture", icon: BarChart3, color: "#1e3a8a" },
  { key: "finitions", label: "Finitions", icon: Palette, color: "#1e3a8a" },
  { key: "autre", label: "Autre", icon: CheckCircle2, color: "#FF7A00" }, // Orange
];

// Props du composant
interface AvancementParEtapesProps {
  chantierId: string;
}

/**
 * Composant AvancementParEtapes
 * - Lit les rapports du chantier depuis le nœud global `rapports/`
 * - Les regroupe par étape (fondations, murs, toiture, finitions, autre)
 * - Affiche une barre de progression par étape
 * - Affiche les rapports avec photos/vidéos pour chaque étape
 */
export default function AvancementParEtapes({ chantierId }: AvancementParEtapesProps) {
  const { database } = getFirebaseServices();
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔍 Listener temps réel pour les rapports
  useEffect(() => {
    if (!chantierId) return;

    console.log("🔍 AvancementParEtapes - Lecture rapports pour chantierId:", chantierId);

    const rapportsRef = ref(database, 'rapports');
    const unsub: Unsubscribe = onValue(rapportsRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        const allRapports = Object.entries(data)
          .map(([id, r]: [string, any]) => ({ id, ...r }))
          .filter((r: Rapport) => String(r.chantierId) === String(chantierId) && r.actif !== false)
          .sort((a: Rapport, b: Rapport) => (b.dateCreation || 0) - (a.dateCreation || 0));

        console.log("✅ AvancementParEtapes - Rapports filtrés:", allRapports.length);
        setRapports(allRapports);
      } else {
        console.log("⚠️ AvancementParEtapes - Aucun rapport trouvé");
        setRapports([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("❌ AvancementParEtapes - Erreur:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [chantierId, database]);

  // Grouper les rapports par étape
  const rapportsParEtape = rapports.reduce((acc, rapport) => {
    const etape = rapport.etape || "autre";
    if (!acc[etape]) acc[etape] = [];
    acc[etape].push(rapport);
    return acc;
  }, {} as Record<string, Rapport[]>);

  // Calculer la progression moyenne par étape
  const progressionParEtape = Object.entries(rapportsParEtape).reduce((acc, [etape, rapportsEtape]) => {
    const maxAvancement = Math.max(...rapportsEtape.map(r => r.avancement || 0));
    acc[etape] = maxAvancement;
    return acc;
  }, {} as Record<string, number>);

  // Calculer la progression globale
  const progressionGlobale = rapports.length > 0 
    ? Math.round(rapports.reduce((sum, r) => sum + (r.avancement || 0), 0) / rapports.length) 
    : 0;

  // Déterminer le statut d'une étape
  const getStatutEtape = (etape: string): "termine" | "en_cours" | "a_venir" => {
    const progression = progressionParEtape[etape] || 0;
    if (progression >= 100) return "termine";
    if (progression > 0) return "en_cours";
    return "a_venir";
  };

  // Styles pour les barres de progression
  const getBarColor = (statut: string) => {
    switch (statut) {
      case "termine": return "#22C55E"; // Vert
      case "en_cours": return "#0B5FFF"; // Bleu
      default: return "#9CA3AF"; // Gris
    }
  };

  if (loading) {
    return (
      <div className="rounded-[20px] border border-[#E7EBF5] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
        <h2 className="text-lg font-black text-[#0D2B6B] mb-4">Avancement par étapes</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-16 rounded-[16px] bg-[#E7EBF5]" />
          <div className="h-16 rounded-[16px] bg-[#E7EBF5]" />
          <div className="h-16 rounded-[16px] bg-[#E7EBF5]" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-[#E7EBF5] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-[#0D2B6B]">Avancement par étapes</h2>
        <span className="text-sm font-bold text-[#0D2B6B]">
          {progressionGlobale}% global
        </span>
      </div>

      {rapports.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            Aucun rapport disponible pour le moment. L'administration suivr les étapes de construction.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ETAPES_STANDARD.map((etape) => {
            const Icon = etape.icon;
            const progression = progressionParEtape[etape.key] || 0;
            const statut = getStatutEtape(etape.key);
            const rapportsEtape = rapportsParEtape[etape.key] || [];

            return (
              <div key={etape.key} className="space-y-2">
                {/* En-tête de l'étape */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={18} style={{ color: etape.color }} />
                    <span className="font-bold text-[#0D2B6B]">{etape.label}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    statut === "termine" ? "bg-green-100 text-green-700" :
                    statut === "en_cours" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {statut === "termine" ? "Terminé" :
                     statut === "en_cours" ? "En cours" : "À venir"}
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${progression}%`, 
                      backgroundColor: getBarColor(statut) 
                    }}
                  />
                </div>

                {/* Nombre de rapports */}
                {rapportsEtape.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {rapportsEtape.length} rapport{rapportsEtape.length > 1 ? 's' : ''} publié{rapportsEtape.length > 1 ? 's' : ''}
                  </p>
                )}

                {/* Photos/vidéos des rapports */}
                {rapportsEtape.slice(0, 3).map((rapport) => (
                  rapport.medias && rapport.medias.length > 0 && (
                    <div key={rapport.id} className="mt-2">
                      <div className="grid grid-cols-4 gap-1">
                        {rapport.medias!.slice(0, 4).map((media) => (
                          <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden border border-[#E7EBF5]">
                            {media.type === "photo" ? (
                              <img 
                                src={media.url} 
                                alt={media.legende || "Photo"} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <video 
                                src={media.url} 
                                className="w-full h-full object-cover" 
                                muted 
                              />
                            )}
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] p-0.5 truncate">
                              {media.legende || rapport.semaine}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}