"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Eye,
  Pencil,
  Ban,
  Check,
  Plus,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { subscribeToAdminNotifications, markAsRead, type Notification } from "@/lib/notifications";
import { useAuthContext } from "@/contexts/AuthContext";
import { getDatabase, ref as dbRef, onValue, update } from "firebase/database";

type Localisation = {
  adresse?: string;
  commune?: string;
  quartier?: string;
  ville?: string;
};

type Client = {
  id: string;
  nom?: string;
  email?: string;
  telephone?: string;
  date_inscription?: string;
  statut?: string;
  lastLogin?: string | number;
};

type Chantier = {
  id: string;
  client_id?: string;
  userId?: string;
  nom?: string;
  nom_projet?: string;
  adresse?: string;
  progression?: number;
  progress?: number;
  statut?: string;
  date_fin?: string;
  dateMiseAJour?: number;
  type?: string;
  budget?: number;
  plan_choisi?: string;
  date_soumission?: string;
  localisation?: Localisation;
  client_nom?: string;
  client_email?: string;
  client_telephone?: string;
};

function formatLocalisation(loc?: Localisation): string {
  if (!loc) return "—";
  return loc.ville || loc.commune || loc.quartier || loc.adresse || "—";
}

function formatDateActivite(timestamp?: string | number): string {
  if (!timestamp) return "";
  const d = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const jour = d.getDate().toString().padStart(2, '0');
  const mois = (d.getMonth() + 1).toString().padStart(2, '0');
  const annee = d.getFullYear();
  return isToday ? "Aujourd'hui" : `${jour}/${mois}/${annee}`;
}

function statutActivite(lastLogin?: string | number): { couleur: string; texte: string } {
  if (!lastLogin) return { couleur: "bg-gray-500", texte: "Jamais connecté" };
  const ts = typeof lastLogin === 'number' ? lastLogin : new Date(lastLogin).getTime();
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const derniere = new Date(ts);
  derniere.setHours(0, 0, 0, 0);
  
  const diffJours = (aujourdhui.getTime() - derniere.getTime()) / (1000 * 60 * 60 * 24);
  
  if (diffJours < 1) {
    return { couleur: "bg-green-500", texte: "🟢 En ligne / Actif aujourd'hui" };
  }
  return { couleur: "bg-gray-500", texte: `⚪ Inactif (Dernière activité : ${formatDateActivite(lastLogin)})` };
}

// Fonction utilitaire pour mettre à jour un chantier dans Firebase
async function updateChantier(chantierId: string, updates: Partial<Chantier>) {
  const db = getDatabase();
  try {
    await update(dbRef(db, `chantiers/${chantierId}`), updates);
    console.log(`✅ Chantier ${chantierId} mis à jour:`, updates);
  } catch (error) {
    console.error(`❌ Erreur mise à jour chantier ${chantierId}:`, error);
    throw error;
  }
}

function AdminContent() {
  const params = useSearchParams();
  const section = params.get("section") || "clients";
  const { user, loading: authLoading } = useAuthContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (authLoading) return <div className="min-h-screen bg-[#111827] flex items-center justify-center"><p className="text-white">Chargement...</p></div>;
  if (!user || user.role !== "admin") return <div className="min-h-screen bg-[#111827] flex items-center justify-center px-4"><div className="text-center"><h1 className="text-2xl font-bold text-red-600">Accès refusé</h1><p className="mt-4 text-white/60">Vous devez être administrateur.</p></div></div>;

  useEffect(() => {
    const db = getDatabase();

    // Clients - Listener temps réel avec indicateur d'activité
    const clientsRef = dbRef(db, 'users');
    const unsubClients = onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const clientsData = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setClients(clientsData);
      } else {
        setClients([]);
      }
    });

    // Chantiers - Listener temps réel - ADMIN MODE: TOUS les chantiers sans filtre
    console.log("🔓 ADMIN MODE - Chargement de TOUS les chantiers sans filtre");
    const chantiersRef = dbRef(db, 'chantiers');
    const unsubChantiers = onValue(chantiersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chantiersData = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setChantiers(chantiersData);
      } else {
        setChantiers([]);
      }
      setLoading(false);
    });

    return () => {
      unsubClients();
      unsubChantiers();
    };
  }, []);

  const filteredClients = clients.filter((c) => 
    c.nom?.toLowerCase().includes(query.toLowerCase()) || 
    c.email?.toLowerCase().includes(query.toLowerCase())
  );

  // Gestionnaires d'actions admin
  const handleValider = async (id: string) => {
    if (!confirm("Valider et activer ce chantier ?")) return;
    setActionLoading(id);
    setMessage(null);
    try {
      await updateChantier(id, { statut: "en_cours", dateMiseAJour: Date.now() });
      setMessage({ type: "success", text: "✅ Chantier activé avec succès !" });
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de l'activation" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleModifier = async (id: string) => {
    alert("Fonctionnalité Modifier en cours de développement");
  };

  return (
    <main className="min-h-screen bg-[#111827] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-xl font-black capitalize text-[#FF7A00]">{section}</h1>
        
        {/* Message d'alerte */}
        {message && (
          <div className={`rounded-[12px] p-4 mb-4 ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            {message.text}
          </div>
        )}
        
        {loading ? <div className="animate-pulse space-y-3"><div className="h-12 rounded bg-white/5" /><div className="h-64 rounded bg-white/5" /></div> : (
          <>
            {section === "clients" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-[14px] bg-white/5 px-4">
                  <Search size={18} className="text-white/40" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40" />
                </div>
                <div className="overflow-x-auto rounded-[16px] border border-white/10">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-white/5 text-xs uppercase text-white/50">
                      <tr>
                        <th className="px-4 py-3 font-bold">Nom</th>
                        <th className="px-4 py-3 font-bold">Email</th>
                        <th className="px-4 py-3 font-bold">Téléphone</th>
                        <th className="px-4 py-3 font-bold">Inscription</th>
                        <th className="px-4 py-3 font-bold">Activité</th>
                        <th className="px-4 py-3 font-bold">Statut</th>
                        <th className="px-4 py-3 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((c) => {
                        const act = statutActivite(c.lastLogin);
                        return (
                          <tr key={c.id} className="border-t border-white/10">
                            <td className="px-4 py-3 font-bold">{c.nom || "—"}</td>
                            <td className="px-4 py-3">{c.email || "—"}</td>
                            <td className="px-4 py-3">{c.telephone || "—"}</td>
                            <td className="px-4 py-3">{c.date_inscription || "—"}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${act.couleur} text-white`}>{act.texte}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.statut === "inactif" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>{c.statut || "actif"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button onClick={() => {}} className="flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-xs font-bold bg-white/10 text-white/70">
                                  <Eye size={14} /> Voir
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {section === "chantiers" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {chantiers.map((c) => (
                    <div key={c.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4 flex flex-col h-full">
                      <h3 className="font-bold mb-2">{c.nom_projet || c.nom}</h3>
                      <p className="text-xs text-white/60 mb-1">{formatLocalisation(c.localisation)}</p>
                      <p className="text-xs mb-3">Statut: {c.statut || "—"}</p>
                      
                      {/* Boutons d'actions */}
                      <div className="mt-auto flex gap-2">
                        <button
                          onClick={() => handleValider(c.id)}
                          disabled={actionLoading === c.id}
                          className="flex-1 rounded-[10px] bg-green-500/20 px-3 py-2 text-xs font-bold text-green-400 hover:bg-green-500/30 transition disabled:opacity-50"
                        >
                          ✅ {actionLoading === c.id ? "Activation..." : "Valider"}
                        </button>
                        <button
                          onClick={() => handleModifier(c.id)}
                          className="flex-1 rounded-[10px] bg-blue-500/20 px-3 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/30 transition"
                        >
                          ✏️ Modifier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {section === "statistiques" && (
              <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
                <h3 className="mb-4 font-black text-[#FF7A00]">📊 Statistiques</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chantiers.map(c => ({ name: c.nom_projet || c.nom || "—", value: c.progression || 0 }))}>
                    <XAxis dataKey="name" stroke="#ffffff60" fontSize={12} />
                    <YAxis stroke="#ffffff60" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FF7A00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function AdminPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#111827] p-4 text-white"><div className="h-12 rounded bg-white/5" /><div className="h-64 rounded bg-white/5" /></div>}><AdminContent /></Suspense>;
}