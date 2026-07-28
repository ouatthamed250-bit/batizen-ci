"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getFirebaseServices } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { formatFcfa } from "@/utils/currency";
import { ETAPES_RENOVATION, getEtapeIndex } from "@/utils/renovation-helpers";

export default function AdminRenovationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uid = params.uid as string;
  const demandeId = params.demandeId as string;
  const { database } = getFirebaseServices();

  const [demande, setDemande] = useState<any>(null);
  const [prix, setPrix] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(database, `demandesRenovation/${uid}/${demandeId}`), (snapshot) => {
      const data = snapshot.val();
      setDemande(data);
      setPrix(data?.prixAdmin || 0);
    });
    return () => unsub();
  }, [uid, demandeId, database]);

  const handleSavePrix = async () => {
    setSaving(true);
    await update(ref(database, `demandesRenovation/${uid}/${demandeId}`), { prixAdmin: prix });
    setSaving(false);
    alert("✅ Prix enregistré");
  };

  const handleChangeStatut = async (nouveauStatut: string) => {
    if (!confirm(`Changer le statut en "${nouveauStatut}" ?`)) return;
    await update(ref(database, `demandesRenovation/${uid}/${demandeId}`), { statut: nouveauStatut });
  };

  if (!demande) return <div className="min-h-screen bg-[#111827] p-4 text-white"><p>Chargement...</p></div>;

  const etapeIdx = getEtapeIndex(demande.statut || "en_attente");

  return (
    <div className="min-h-screen bg-[#111827] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <button onClick={() => router.push("/admin/renovations")} className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft size={18} /> Retour aux rénovations
        </button>

        <h1 className="text-2xl font-black">🔨 {demande.lieu || "Sans lieu"}</h1>

        {/* Timeline 5 étapes */}
        <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-bold mb-4">📋 Étapes</h3>
          <div className="flex items-center gap-2 overflow-x-auto">
            {ETAPES_RENOVATION.map((etape, i) => {
              const isActive = i <= Math.max(0, etapeIdx);
              return (
                <div key={etape.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${isActive ? "bg-[#FF7A00]/20 text-[#FF7A00]" : "bg-white/5 text-white/40"}`}>
                  <span>{etape.icon}</span>
                  <span>{etape.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Infos client */}
        <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-bold mb-3">👤 Informations</h3>
          <p className="text-sm">Lieu : {demande.lieu}</p>
          <p className="text-sm">Surface : {demande.surface} m²</p>
          <p className="text-sm">Étages : {demande.etages > 1 ? `R+${demande.etages - 1}` : "RDC"}</p>
          {demande.distanceKm > 0 && <p className="text-sm">Distance Abidjan : {demande.distanceKm} km</p>}
          <p className="text-sm">Transport : {demande.transportGere ? "Géré par client" : "Non géré"}</p>
          <p className="text-sm">Montant estimé : {formatFcfa(demande.montantEstime || 0)}</p>
          <p className="text-xs text-white/40 mt-2">UID: {uid}</p>
        </div>

        {/* Fixer le prix */}
        <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-bold mb-3">💰 Fixer le prix</h3>
          <div className="flex gap-3 items-center">
            <input type="number" value={prix} onChange={e => setPrix(Number(e.target.value))} className="h-[54px] rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none flex-1" placeholder="Prix en FCFA" />
            <button onClick={handleSavePrix} disabled={saving} className="h-[54px] rounded-[18px] bg-[#FF7A00] px-6 font-bold disabled:opacity-50">
              {saving ? "..." : "💾 Sauvegarder"}
            </button>
          </div>
          {demande.prixAdmin && <p className="mt-2 text-sm text-[#FF7A00]">Prix actuel : {formatFcfa(demande.prixAdmin)}</p>}
        </div>

        {/* Changer le statut */}
        <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
          <h3 className="font-bold mb-3">🔄 Changer le statut</h3>
          <div className="flex flex-wrap gap-2">
            {ETAPES_RENOVATION.map(e => (
              <button key={e.id} onClick={() => handleChangeStatut(e.id)} disabled={demande.statut === e.id}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${demande.statut === e.id ? "bg-[#FF7A00] text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`}>
                {e.icon} {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contrat */}
        {demande.prixAdmin && demande.prixAdmin > 0 && (
          <div className="rounded-[16px] border border-[#FF7A00]/30 bg-[#FF7A00]/5 p-6">
            <h3 className="font-bold mb-3">📄 Contrat de rénovation</h3>
            <button onClick={() => {
              const { getContratRenovationTemplate } = require("@/lib/documents-templates");
              const template = getContratRenovationTemplate({
                lieu: demande.lieu,
                surface: demande.surface,
                etages: demande.etages,
                montant: demande.prixAdmin,
                clientNom: "Client",
                date: new Date().toLocaleDateString('fr-FR'),
              });
              const w = window.open('', '_blank');
              if (w) { w.document.write(template); w.document.close(); }
            }} className="h-[54px] rounded-[18px] bg-gradient-to-r from-[#FF7A00] to-[#FF8C00] px-6 font-black text-white">
              📄 Générer le contrat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}