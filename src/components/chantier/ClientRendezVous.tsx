"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Check, X, Clock, MapPin, AlertCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { rtdbGetList } from "@/lib/rtdb";
import { getFirebaseServices } from "@/lib/firebase";
import { ref, push, update, onValue } from "firebase/database";

interface RendezVous {
  id: string;
  chantierId: string;
  clientId: string;
  titre: string;
  type: string;
  date: string;
  heure: string;
  duree: string;
  lieu: string;
  description: string;
  statut: "propose" | "confirme_admin" | "confirme_client" | "reporte" | "annule";
  creePar: string;
  creeParRole: "admin" | "client";
  dateCreation: number;
  dateModification: number;
  actif: boolean;
}

interface ClientRendezVousProps {
  chantierId: string;
}

/**
 * Composant RENDEZ-VOUS BIDIRECTIONNEL côté client
 * - Affiche les RDV depuis le nœud global rendezvous/
 * - Permet au client de proposer un RDV
 * - Permet au client de confirmer un RDV proposé par l'admin
 */
export default function ClientRendezVous({ chantierId }: ClientRendezVousProps) {
  const { user } = useAuthContext();
  const { database } = getFirebaseServices();

  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rdvForm, setRdvForm] = useState({
    titre: "",
    type: "rdv_client",
    date: "",
    heure: "09:00",
    duree: "1h",
    lieu: "",
    description: ""
  });

  useEffect(() => {
    if (!user || !chantierId) return;

    // Charger les RDV depuis le nœud global rendezvous/
    const loadRdvs = async () => {
      const allRdvs = await rtdbGetList<any>(`rendezvous/`);
      const rdvsFiltered = allRdvs.filter((r: any) => 
        String(r?.chantierId) === String(chantierId) && r?.actif !== false
      );
      setRendezVous(rdvsFiltered);
      setLoading(false);
    };
    loadRdvs();

    // Écoute en temps réel
    const rdvsRef = ref(database, 'rendezvous');
    const unsubscribe = onValue(rdvsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rdvs = Object.entries(data)
          .filter(([id, r]: [string, any]) => 
            String(r?.chantierId) === String(chantierId) && r?.actif !== false
          )
          .map(([id, r]: [string, any]) => ({ id, ...r }))
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setRendezVous(rdvs);
      } else {
        setRendezVous([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, chantierId, database]);

  // Proposer un RDV (côté client)
  const handleProposerRdv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rdvForm.titre.trim() || !rdvForm.date) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await push(ref(database, 'rendezvous'), {
        chantierId: String(chantierId),
        clientId: user?.uid,
        titre: rdvForm.titre,
        type: rdvForm.type,
        date: rdvForm.date,
        heure: rdvForm.heure,
        duree: rdvForm.duree,
        lieu: rdvForm.lieu,
        description: rdvForm.description,
        statut: "propose",
        creePar: user?.uid || "client",
        creeParRole: "client",
        dateCreation: Date.now(),
        dateModification: Date.now(),
        actif: true
      });

      // Envoyer notification à l'admin
      const { sendAdminNotification } = await import("@/lib/notifications");
      await sendAdminNotification({
        type: "nouveau_rdv",
        chantierId: chantierId,
        message: `Nouveau RDV proposé par le client pour le chantier ${chantierId}`
      });

      alert("✅ Rendez-vous proposé avec succès ! L'administrateur va le confirmer.");
      setShowForm(false);
      setRdvForm({
        titre: "",
        type: "rdv_client",
        date: "",
        heure: "09:00",
        duree: "1h",
        lieu: "",
        description: ""
      });
    } catch (error) {
      console.error("Erreur proposition RDV:", error);
      alert("Erreur lors de la proposition du rendez-vous");
    }
  };

  // Confirmer un RDV (côté client)
  const handleConfirmerRdv = async (rdvId: string) => {
    try {
      await update(ref(database, `rendezvous/${rdvId}`), {
        statut: "confirme_client",
        dateModification: Date.now()
      });

      // Envoyer notification à l'admin
      const { sendAdminNotification } = await import("@/lib/notifications");
      await sendAdminNotification({
        type: "confirme_rdv",
        chantierId: chantierId,
        message: `Le client a confirmé le rendez-vous ${rdvId}`
      });

      alert("✅ Rendez-vous confirmé !");
    } catch (error) {
      console.error("Erreur confirmation RDV:", error);
      alert("Erreur lors de la confirmation");
    }
  };

  // Mapper le statut
  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "propose":
        return <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-black text-blue-400">📝 Proposé</span>;
      case "confirme_admin":
        return <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-black text-green-400">✅ À confirmer</span>;
      case "confirme_client":
        return <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-black text-green-400">✅ Confirmé</span>;
      case "reporte":
        return <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-black text-orange-400">⏸️ Reporté</span>;
      case "annule":
        return <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-black text-red-400">❌ Annulé</span>;
      default:
        return <span className="rounded-full bg-gray-500/20 px-2 py-0.5 text-[10px] font-black text-gray-400">—</span>;
    }
  };

  // Mapper le type d'icône
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "visite": return "🏗️";
      case "livraison": return "📦";
      case "coulee": return "🧱";
      case "reunion": return "🤝";
      case "rdv_client": return "👤";
      default: return "📌";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-20 rounded-[18px] bg-gray-200" />
          <div className="h-20 rounded-[18px] bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec bouton proposer */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-[#0D2B6B] flex items-center gap-2">
          <Calendar size={20} />
          Rendez-vous
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-2 bg-[#0B5FFF] text-white rounded-xl font-bold hover:bg-[#0a4fd9] transition text-sm"
        >
          <Plus size={16} />
          Proposer un RDV
        </button>
      </div>

      {/* Formulaire de proposition */}
      {showForm && (
        <form onSubmit={handleProposerRdv} className="p-4 bg-white rounded-[18px] border border-[#E7EBF5] shadow-sm space-y-3">
          <h4 className="font-bold text-[#0D2B6B]">Proposer un rendez-vous</h4>

          <div>
            <label className="text-xs text-[#6B7280] mb-1 block">Titre du RDV *</label>
            <input
              type="text"
              value={rdvForm.titre}
              onChange={(e) => setRdvForm({ ...rdvForm, titre: e.target.value })}
              placeholder="Ex: Visite du chantier, Réunion..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#6B7280] mb-1 block">Date *</label>
              <input
                type="date"
                value={rdvForm.date}
                onChange={(e) => setRdvForm({ ...rdvForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-[#6B7280] mb-1 block">Heure</label>
              <input
                type="time"
                value={rdvForm.heure}
                onChange={(e) => setRdvForm({ ...rdvForm, heure: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#6B7280] mb-1 block">Lieu (optionnel)</label>
            <input
              type="text"
              value={rdvForm.lieu}
              onChange={(e) => setRdvForm({ ...rdvForm, lieu: e.target.value })}
              placeholder="Adresse ou lieu de rendez-vous"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-[#6B7280] mb-1 block">Description</label>
            <textarea
              value={rdvForm.description}
              onChange={(e) => setRdvForm({ ...rdvForm, description: e.target.value })}
              placeholder="Détails du rendez-vous..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
          >
            ✅ Proposer le rendez-vous
          </button>
        </form>
      )}

      {/* Liste des RDV */}
      {rendezVous.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[#E7EBF5] bg-white p-8 text-center">
          <p className="text-sm font-bold text-[#6B7280]">Aucun rendez-vous planifié.</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Proposez un créneau à l'administrateur.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rendezVous.map((rdv) => {
            const isPast = new Date(rdv.date) < new Date();
            const isConfirmeParAdmin = rdv.statut === "confirme_admin";

            return (
              <div
                key={rdv.id}
                className={`rounded-[18px] border p-4 shadow-sm ${
                  isConfirmeParAdmin
                    ? "bg-green-50 border-green-200"
                    : isPast
                    ? "bg-gray-50 border-gray-200 opacity-60"
                    : "bg-white border-[#E7EBF5]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getTypeIcon(rdv.type)}</span>
                      <h4 className="font-bold text-[#0D2B6B]">{rdv.titre}</h4>
                      {getStatutBadge(rdv.statut)}
                    </div>
                    <p className="text-sm text-[#374151] flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(rdv.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })} à {rdv.heure || "—"}
                    </p>
                    {rdv.lieu && (
                      <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
                        <MapPin size={12} />
                        {rdv.lieu}
                      </p>
                    )}
                    {rdv.description && (
                      <p className="text-xs text-[#6B7280] mt-1">{rdv.description}</p>
                    )}
                  </div>

                  {/* Bouton confirmer si l'admin a confirmé et que le client n'a pas encore confirmé */}
                  {isConfirmeParAdmin && (
                    <button
                      onClick={() => handleConfirmerRdv(rdv.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-xl font-bold text-xs hover:bg-green-600 transition"
                    >
                      <Check size={14} />
                      Confirmer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-xs text-blue-700 flex items-center gap-1">
          <AlertCircle size={14} />
          Les rendez-vous confirmés par l'administrateur nécessitent votre validation.
        </p>
      </div>
    </div>
  );
}