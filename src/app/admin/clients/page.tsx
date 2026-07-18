"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Search, Pause, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { rtdbGetList, rtdbGet, rtdbSet } from "@/lib/rtdb";
import { getDatabase, ref, onValue } from "firebase/database";
import { useAuthContext } from "@/contexts/AuthContext";

type Client = {
  id: string;
  nom?: string;
  email?: string;
  telephone?: string;
  date_inscription?: string;
  statut?: string;
  statutCompte?: "actif" | "suspendu";
  raisonSuspension?: string;
};

type Chantier = {
  id: string;
  userId?: string;
  client_id?: string;
  nom?: string;
  nom_projet?: string;
  statut?: string;
};

export default function AdminClientsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [suspendModal, setSuspendModal] = useState<{ clientId: string; raison: string } | null>(null);
  const [creationCounts, setCreationCounts] = useState<Record<string, { compteur: number; date: string }>>({});

  // Protection admin
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <p className="text-white">Chargement...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Accès refusé</h1>
          <p className="mt-4 text-white/60">Vous devez être administrateur.</p>
        </div>
      </div>
    );
  }

  // Chargement des clients
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const usersList = await rtdbGetList<Client>("users");
      if (cancelled) return;
      setClients(usersList);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Chargement des compteurs de création en temps réel
  useEffect(() => {
    const db = getDatabase();
    const unsub = onValue(ref(db, "users"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const counts: Record<string, { compteur: number; date: string }> = {};
        Object.entries(data).forEach(([uid, userData]: [string, any]) => {
          if (userData.creationsDuJour) {
            counts[uid] = userData.creationsDuJour;
          }
        });
        setCreationCounts(counts);
      }
    });
    return () => unsub();
  }, []);

  const filteredClients = clients.filter(
    (c) =>
      c.nom?.toLowerCase().includes(query.toLowerCase()) ||
      c.email?.toLowerCase().includes(query.toLowerCase())
  );

  // Suspendre/Réactiver un client
  const toggleSuspension = async (clientId: string, suspend: boolean, raison?: string) => {
    try {
      await rtdbSet(`users/${clientId}`, {
        statutCompte: suspend ? "suspendu" : "actif",
        raisonSuspension: suspend && raison ? raison : null
      });
      setClients((prev) => prev.map((c) => 
        c.id === clientId 
          ? { ...c, statutCompte: suspend ? "suspendu" : "actif", raisonSuspension: raison || undefined }
          : c
      ));
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  // Compteur du jour
  const today = new Date().toISOString().slice(0, 10);
  const getCompteurToday = (userId: string) => {
    const count = creationCounts[userId];
    return count && count.date === today ? count.compteur : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] p-6">
        <div className="mx-auto max-w-6xl">
          <div className="h-12 rounded-[12px] bg-white/5 mb-4" />
          <div className="h-64 rounded-[16px] bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#111827] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-black text-[#FF7A00]">
          👥 Gestion des Clients
        </h1>

        {/* Recherche */}
        <div className="flex items-center gap-3 rounded-[14px] bg-white/5 px-4 mb-6 max-w-md">
          <Search size={18} className="text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </div>

        {/* Liste des clients */}
        <div className="overflow-x-auto rounded-[16px] border border-white/10">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-white/50">
              <tr>
                <Th>Nom</Th>
                <Th>Email</Th>
                <Th>Téléphone</Th>
                <Th>Inscription</Th>
                <Th>Statut Compte</Th>
                <Th>Créations aujourd'hui</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => (
                <tr key={c.id} className="border-t border-white/10">
                  <Td className="font-bold">{c.nom || "—"}</Td>
                  <Td>{c.email || "—"}</Td>
                  <Td>{c.telephone || "—"}</Td>
                  <Td>{c.date_inscription || "—"}</Td>
                  <Td>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      c.statutCompte === "suspendu" 
                        ? "bg-red-500/20 text-red-400" 
                        : "bg-green-500/20 text-green-400"
                    }`}>
                      {c.statutCompte === "suspendu" ? "⏸️ Suspendu" : "✅ Actif"}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs">
                      {getCompteurToday(c.id)}/3
                    </span>
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      {c.statutCompte === "suspendu" ? (
                        <button
                          onClick={() => toggleSuspension(c.id, false)}
                          className="flex items-center gap-1 rounded-[10px] bg-green-500/15 px-2.5 py-1.5 text-xs font-bold text-green-400 transition hover:bg-green-500/25"
                          title="Réactiver"
                        >
                          <Play size={14} /> Réactiver
                        </button>
                      ) : (
                        <button
                          onClick={() => setSuspendModal({ clientId: c.id, raison: "" })}
                          className="flex items-center gap-1 rounded-[10px] bg-red-500/15 px-2.5 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/25"
                          title="Suspendre"
                        >
                          <Pause size={14} /> Suspendre
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && (
          <div className="rounded-[16px] border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/50">Aucun client trouvé.</p>
          </div>
        )}

        {/* Modal de suspension */}
        {suspendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-[20px] border border-white/20 bg-[#1F2937] p-6">
              <h3 className="mb-4 text-lg font-black text-[#FF7A00]">
                ⏸️ Suspendre le compte client
              </h3>
              <form onSubmit={(e: FormEvent) => {
                e.preventDefault();
                toggleSuspension(suspendModal.clientId, true, suspendModal.raison);
                setSuspendModal(null);
              }} className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs text-white/60">Raison de la suspension (optionnel)</span>
                  <textarea
                    value={suspendModal.raison}
                    onChange={(e) => setSuspendModal({ ...suspendModal, raison: e.target.value })}
                    placeholder="Ex: Comportement inapproprié, non-paiement..."
                    className="h-24 w-full rounded-[12px] bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10"
                  />
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSuspendModal(null)}
                    className="flex-1 rounded-[12px] bg-white/10 py-2.5 font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-[12px] bg-red-500 py-2.5 font-black"
                  >
                    Suspendre
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* Helpers UI */
function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 font-bold">{children}</th>;
}
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}