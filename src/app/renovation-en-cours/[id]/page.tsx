"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Clock, CheckCircle2, HardHat, ArrowLeft } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import { useAuthContext } from "@/contexts/AuthContext";
import { formatFcfa } from "@/utils/currency";
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

  const estActive = demande?.statut === "en_cours" || demande?.statut === "active";
  const statutLabel = demande?.statut === "en_attente" ? "En attente"
    : demande?.statut === "en_cours" || demande?.statut === "active" ? "En cours"
    : demande?.statut === "termine" ? "Terminé" : "Annulé";

  const pageContent = (
    <div className="min-h-screen pt-8 pb-24 px-2">
      <div className="mx-auto max-w-[430px] space-y-6">
        
        {/* Bouton retour */}
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-sm font-bold text-blue-200">
          <ArrowLeft size={16} /> Retour au tableau de bord
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00]" />
          </div>
        ) : !demande ? (
          <div className="text-center py-12">
            <p className="text-white font-bold">Demande introuvable.</p>
          </div>
        ) : (
          <>
            {/* En-tête */}
            <div className="rounded-[25px] border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-xl border-t-[6px] border-t-[#FF6B00]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF6B00]">RÉNOVATION</p>
                  <h1 className="mt-1 text-2xl font-black text-white">{demande.lieu || "Sans lieu"}</h1>
                  <p className="text-sm text-blue-100">{demande.surface} m² · {demande.etages > 1 ? `R+${demande.etages - 1}` : "RDC"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${
                  estActive ? "bg-green-500/20 text-green-400" : "bg-[#FF6B00]/20 text-[#FF6B00]"
                }`}>
                  {statutLabel}
                </span>
              </div>

              {estActive ? (
                <>
                  {/* Barre progression */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-blue-200">Avancement</span>
                      <span className="text-xs font-black text-[#FF6B00]">0%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00]" style={{ width: "0%" }} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-blue-200">Montant estimé</p>
                      <p className="mt-1 font-black text-white">{formatFcfa(demande.montantEstime)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-blue-200">Transport</p>
                      <p className="mt-1 font-black text-white">{demande.transportGere ? "Géré par client" : "À prévoir"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-[16px] bg-white/10 border border-white/20 p-4 text-center">
                  <Clock size={24} className="mx-auto text-[#FF6B00] mb-2" />
                  <p className="text-sm font-bold text-white">Votre demande est en cours d'étude par notre équipe.</p>
                  <p className="text-xs text-blue-100 mt-1">Vous serez notifié dès qu'un expert sera assigné.</p>
                </div>
              )}
            </div>

            {/* Infos supplémentaires si active */}
            {estActive && (
              <div className="rounded-[25px] border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-xl">
                <h3 className="font-black text-white mb-3 flex items-center gap-2">
                  <HardHat size={16} /> Suivi rénovation
                </h3>
                <p className="text-sm text-blue-100">
                  Le suivi détaillé des travaux sera disponible ici une fois que l'équipe aura démarré le chantier.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <BtpBackground
      imageUrl="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop"
      overlay="medium"
    >
      {pageContent}
    </BtpBackground>
  );
}