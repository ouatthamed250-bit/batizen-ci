"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Clock, CheckCircle2, HardHat, ArrowLeft } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import { useAuthContext } from "@/contexts/AuthContext";
import { formatFcfa } from "@/utils/currency";
import { ETAPES_RENOVATION, getEtapeIndex } from "@/utils/renovation-helpers";
import BtpBackground from "@/components/btp/BtpBackground";

interface RenovationDemande {
  id: string;
  userId: string;
  lieu: string;
  surface: number;
  etages: number;
  distanceKm: number;
  transportGere: boolean;
  montantEstime: number;
  statut: string;
  createdAt: number;
  prixAdmin?: number;
  prixVisite?: number;
}

export default function RenovationEnCoursPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const [demande, setDemande] = useState<RenovationDemande | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !params.id) return;
    const { database } = getFirebaseServices();
    const refDemande = ref(database, `demandesRenovation/${user.uid}/${params.id}`);
    const unsub = onValue(refDemande, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDemande(data as RenovationDemande);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user, params.id]);

  const etapeIdx = getEtapeIndex(demande?.statut || "en_attente");
  const estActive = demande?.statut === "en_cours" || demande?.statut === "active";
  const statutLabel = demande?.statut === "en_attente" ? "En attente"
    : demande?.statut === "en_cours" || demande?.statut === "active" ? "En cours"
    : demande?.statut === "termine" ? "Terminé" : "Annulé";

  const handleGenererContrat = () => {
    const { getContratRenovationTemplate } = require("@/lib/documents-templates");
    const template = getContratRenovationTemplate({
      lieu: demande?.lieu || "",
      surface: demande?.surface || 0,
      etages: demande?.etages || 1,
      montant: demande?.prixAdmin || demande?.montantEstime || 0,
      clientNom: "Client",
      type: "Rénovation",
      delai: demande?.statut === "termine" ? "Terminé" : "En cours",
      conditions: "Paiement à la livraison"
    });
    const w = window.open('', '_blank');
    if (w) { w.document.write(template); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const pageContent = (
    <div className="min-h-screen pt-8 pb-24 px-2">
      <div className="mx-auto max-w-[430px] space-y-6">

        {/* Bouton retour */}
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-sm font-bold text-blue-200">
          <ArrowLeft size={16} /> Retour au tableau de bord
        </button>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-24 rounded-[24px] bg-white/10" />
            <div className="h-12 rounded-[24px] bg-white/10" />
            <div className="h-64 rounded-[24px] bg-white/10" />
          </div>
        ) : !demande ? (
          <div className="rounded-[28px] border border-white/30 bg-white/20 p-6 backdrop-blur-xl text-center">
            <p className="text-white/50">Demande non trouvée.</p>
          </div>
        ) : (
          <>
            {/* Timeline des 5 étapes */}
            <div className="rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl">
              <h3 className="font-black text-white mb-4 text-sm">📋 Avancement</h3>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {ETAPES_RENOVATION.map((etape, i) => {
                  const isActive = i <= Math.max(0, etapeIdx);
                  const isCurrent = i === Math.max(0, etapeIdx);
                  return (
                    <div key={etape.id} className={`flex flex-col items-center gap-1 min-w-[72px]`}>
                      <div className={`size-8 rounded-full flex items-center justify-center text-sm ${
                        isCurrent ? "bg-[#FF7A00] text-white shadow-lg" :
                        isActive ? "bg-[#FF7A00]/30 text-white" :
                        "bg-white/10 text-white/40"
                      }`}>
                        <span>{etape.icon}</span>
                      </div>
                      <span className={`text-[9px] font-bold text-center leading-tight ${
                        isActive ? "text-white" : "text-white/40"
                      }`}>{etape.label}</span>
                      {i < ETAPES_RENOVATION.length - 1 && (
                        <div className={`h-0.5 w-4 ${isActive ? "bg-[#FF7A00]/50" : "bg-white/10"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Infos demande */}
            <div className="rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-6 shadow-xl space-y-3">
              <h2 className="font-black text-xl text-white">{demande.lieu}</h2>
              <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
                <span>📐 Surface : {demande.surface} m²</span>
                <span>🏗️ {demande.etages > 1 ? `R+${demande.etages - 1}` : "RDC"}</span>
                <span>📏 Distance : {demande.distanceKm} km</span>
                <span>🚚 Transport : {demande.transportGere ? "Inclus" : "Non inclus"}</span>
              </div>
              <p className="text-sm text-white/60">Statut : <span className="font-bold text-[#FF7A00]">{statutLabel}</span></p>
              {demande.montantEstime > 0 && <p className="text-lg font-black text-[#FF7A00]">💰 {formatFcfa(demande.montantEstime)}</p>}
            </div>

            {/* Prix visite technique */}
            {demande.prixVisite && demande.prixVisite > 0 && (
              <div className="rounded-[28px] border border-[#FF7A00]/30 bg-[#FF7A00]/10 backdrop-blur-xl p-5 shadow-xl">
                <p className="text-sm text-white/80">💳 Visite technique : <span className="font-bold text-white">{formatFcfa(demande.prixVisite)}</span></p>
              </div>
            )}

            {/* Prix admin (devis) */}
            {demande.prixAdmin && demande.prixAdmin > 0 && (
              <div className="rounded-[28px] border border-green-500/30 bg-green-500/10 backdrop-blur-xl p-5 shadow-xl">
                <p className="text-sm text-white/80">📄 Devis estimé : <span className="font-bold text-white">{formatFcfa(demande.prixAdmin)}</span></p>
              </div>
            )}

            {/* Bouton contrat */}
            {demande.prixAdmin && demande.prixAdmin > 0 && (
              <button onClick={handleGenererContrat} className="w-full h-[56px] rounded-[18px] bg-gradient-to-r from-[#FF7A00] to-[#FF8C00] font-black text-white shadow-lg">
                📄 Télécharger le contrat
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <BtpBackground imageUrl="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3" overlay="medium">
      {pageContent}
    </BtpBackground>
  );
}