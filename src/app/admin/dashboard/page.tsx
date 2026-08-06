'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, HardHat, Clock, CheckCircle2, Hammer } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useChantiers } from '@/hooks/useChantiers';
import type { Chantier } from '@/types/chantier';
import { formatDateCourte } from '@/utils/formatters';
import { getFirebaseServices } from '../../../lib/firebase';
import { ref, get } from 'firebase/database';

type Localisation = {
  adresse?: string;
  commune?: string;
  quartier?: string;
  ville?: string;
};
type Client = {
  id: string;
  displayName?: string;
  email?: string;
  telephone?: string;
  chantiers?: Chantier[];
  rapports?: any[];
  paiements?: any[];
};

const getSanteChantier = (chantier: any, rapports: any[], paiements: any[]) => {
  const rapportsEnRetard = rapports.filter(r => r.chantierId === chantier.id && r.statut === "retard");
  if (rapportsEnRetard.length > 0) {
    return { couleur: "red", label: "⚠️ Retard signalé" };
  }
  const paiementsEnAttente = paiements.filter(p => p.chantierId === chantier.id && p.statut === "en_attente");
  if (paiementsEnAttente.length > 0) {
    return { couleur: "orange", label: "💰 Paiement en attente" };
  }
  const rapportsChantier = rapports.filter(r => r.chantierId === chantier.id);
  const dernierRapport = rapportsChantier.sort((a, b) => b.dateCreation - a.dateCreation)[0];
  if (dernierRapport && (Date.now() - dernierRapport.dateCreation) > 7 * 24 * 60 * 60 * 1000) {
    return { couleur: "orange", label: "📋 Aucun rapport récent" };
  }
  return { couleur: "green", label: "✅ Dans les délais" };
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { assignerChantier } = useChantiers();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [chantiersEnAttente, setChantiersEnAttente] = useState<Chantier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [renovationsEnAttente, setRenovationsEnAttente] = useState(0);

  const loadDashboard = useCallback(async () => {
    if (authLoading) return;
    if (!user) return;
    const { db: db } = getFirebaseServices();
    const usersRef = ref(db, 'users');
    const chantiersRef = ref(db, 'chantiers');
    const rapportsRef = ref(db, 'rapports');
    const paiementsRef = ref(db, 'paiements');
    try {
      const [usersSnap, chantiersSnap, rapportsSnap, paiementsSnap, renovationsSnap] = await Promise.all([
        get(usersRef),
        get(chantiersRef),
        get(rapportsRef),
        get(paiementsRef),
        get(ref(db, 'demandesRenovation')),
      ]);
      const usersData = usersSnap.val() || {};
      const allRenovations = renovationsSnap.val() || {};
      let enAttenteCount = 0;
      Object.values(allRenovations).forEach((userRenovations: any) => {
        if (!userRenovations) return;
        Object.values(userRenovations).forEach((d: any) => {
          if (d?.statut === 'en_attente') enAttenteCount++;
        });
      });
      setRenovationsEnAttente(enAttenteCount);
      const allChantiers = chantiersSnap.val() || {};
      const allRapports = Object.entries(rapportsSnap.val() || {}).map(([id, r]: [string, any]) => ({ id, ...r }));
      const allPaiements = Object.entries(paiementsSnap.val() || {}).map(([id, p]: [string, any]) => ({ id, ...p }));
      const chantiersList = Object.entries(allChantiers).map(([id, c]: [string, any]) => ({
        id,
        ...c,
      })) as Chantier[];
      const enAttente = chantiersList.filter(
        (c) => !c.adminId || c.adminId.length === 0
      );
      setChantiersEnAttente(enAttente);
      const mesChantiers = chantiersList.filter(
        (c) => c.adminId === user.uid
      );
      const clientsList = Object.entries(usersData)
        .filter(([id, u]: [string, any]) => (u.role || u.userRole) === "client")
        .map(([id, u]: [string, any]) => ({
          id,
          ...u,
          displayName: u.displayName || u.nom || "Sans nom"
        }));
      const clientsWithChantiers = clientsList.map((client) => {
        const clientChantiers = mesChantiers.filter(
          (c) => c.userId === client.id || c.client_id === client.id
        );
        const clientRapports = allRapports.filter((r: any) =>
          clientChantiers.some((ch) => ch.id === r.chantierId)
        );
        const clientPaiements = allPaiements.filter((p: any) =>
          clientChantiers.some((ch) => ch.id === p.chantierId)
        );
        return { ...client, chantiers: clientChantiers, rapports: clientRapports, paiements: clientPaiements };
      });
      setClients(clientsWithChantiers);
    } catch (err) {
      console.error('❌ Erreur chargement dashboard:', err);
    }
    setLoading(false);
  }, [user, authLoading, router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleAssigner = async (chantierId: string) => {
    if (!user?.uid) return;
    setAssigningId(chantierId);
    const success = await assignerChantier(chantierId, user.uid);
    if (success) {
      const chantier = chantiersEnAttente.find((c) => c.id === chantierId);
      setChantiersEnAttente((prev) => prev.filter((c) => c.id !== chantierId));
      if (chantier) {
        loadDashboard();
      }
    }
    setAssigningId(null);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mx-auto mb-4"></div>
          <p className="text-white/60">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">
          🏗️ Dashboard Principal BÂTIZEN CI
        </h1>
        <p className="text-white/60">
          Bienvenue, {user?.displayName || user?.email}. Voici vos chantiers assignés.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div
          onClick={() => router.push('/admin/renovations')}
          className="rounded-xl border border-white/10 bg-white/5 shadow-sm p-5 flex flex-col items-center text-center gap-2 hover:bg-white/[0.08] hover:border-[#FF7A00]/30 cursor-pointer transition"
        >
          <div className="grid size-12 place-items-center rounded-xl bg-purple-500/20 text-purple-400">
            <Hammer size={24} />
          </div>
          <p className="text-xs font-bold text-white/50 uppercase">Rénovations en attente</p>
          <p className="text-2xl font-black text-white">{renovationsEnAttente}</p>
          <p className="text-[10px] text-white/40">Voir les demandes</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 shadow-sm p-5 flex flex-col items-center text-center gap-2">
          <div className="grid size-12 place-items-center rounded-xl bg-blue-500/20 text-blue-400">
            <HardHat size={24} />
          </div>
          <p className="text-xs font-bold text-white/50 uppercase">Chantiers en cours</p>
          <p className="text-2xl font-black text-white">{clients.reduce((acc, c) => acc + (c.chantiers?.length || 0), 0)}</p>
          <p className="text-[10px] text-white/40">Assignés</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 shadow-sm p-5 flex flex-col items-center text-center gap-2">
          <div className="grid size-12 place-items-center rounded-xl bg-green-500/20 text-green-400">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-xs font-bold text-white/50 uppercase">Clients</p>
          <p className="text-2xl font-black text-white">{clients.length}</p>
          <p className="text-[10px] text-white/40">Actifs</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 shadow-sm p-5 flex flex-col items-center text-center gap-2">
          <div className="grid size-12 place-items-center rounded-xl bg-amber-500/20 text-amber-400">
            <Clock size={24} />
          </div>
          <p className="text-xs font-bold text-white/50 uppercase">En attente</p>
          <p className="text-2xl font-black text-white">{chantiersEnAttente.length}</p>
          <p className="text-[10px] text-white/40">Chantiers</p>
        </div>
      </div>

      {chantiersEnAttente.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Clock size={24} className="text-amber-400" />
              Chantiers en attente d'assignation
              <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">
                {chantiersEnAttente.length}
              </span>
            </h2>
            <Link
              href="/admin/chantiers/assigner"
              className="text-sm font-semibold text-[#FF7A00] hover:text-[#E66E00] transition"
            >
              Voir tout →
            </Link>
          </div>
          <div className="grid gap-3">
            {chantiersEnAttente.slice(0, 5).map((chantier) => (
              <div
                key={chantier.id}
                className="rounded-xl border border-amber-500/30 bg-white/5 shadow-sm p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">
                    {chantier.nom_projet || chantier.nom || 'Chantier sans nom'}
                  </p>
                  <p className="text-xs text-white/50">
                    {chantier.type || 'Non spécifié'} — {chantier.localisation?.ville || 'Localisation inconnue'}
                  </p>
                  {chantier.dateCreation && (
                    <p className="text-xs text-white/40">
                      Soumis le {formatDateCourte(chantier.dateCreation.toString())}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleAssigner(chantier.id)}
                  disabled={assigningId === chantier.id}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition ${
                    assigningId === chantier.id
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-[#FF7A00] text-white hover:bg-[#E66E00]'
                  }`}
                >
                  {assigningId === chantier.id ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <HardHat size={14} />
                      Prendre en charge
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-white/40" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par nom, email ou téléphone..."
          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/50 focus:border-[#FF7A00] transition"
        />
      </div>

      <div className="space-y-4">
        {clients.filter((client) => {
          if (!searchTerm.trim()) return true;
          const term = searchTerm.toLowerCase();
          return (client.displayName || "").toLowerCase().includes(term) ||
                 (client.email || "").toLowerCase().includes(term);
        }).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-[28px] bg-white/5 border border-white/10 shadow-sm">
            <div className="grid size-16 place-items-center rounded-full bg-white/10 text-white/40 mb-4">
              <HardHat size={32} />
            </div>
            <h2 className="text-xl font-black text-white mb-2">
              Aucun chantier assigné
            </h2>
            <p className="text-sm text-white/50 max-w-xs">
              Les chantiers que vous prendrez en charge apparaîtront ici.
              Utilisez la section "Chantiers en attente" ci-dessus pour commencer.
            </p>
          </div>
        ) : (
          clients
            .filter((client) => {
              if (!searchTerm.trim()) return true;
              const term = searchTerm.toLowerCase();
              return (client.displayName || "").toLowerCase().includes(term) ||
                     (client.email || "").toLowerCase().includes(term);
            })
            .map((client) => (
              <div key={client.id} className="rounded-2xl border border-white/10 bg-white/5 shadow-sm p-5 hover:bg-white/[0.08] transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#FF7A00]/10 flex items-center justify-center text-[#FF7A00] font-black text-lg">
                    {(client.displayName || "CL").charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{client.displayName || "Sans nom"}</h4>
                    <p className="text-xs text-white/50">{client.email || "—"}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs font-semibold text-white/60 mb-2 flex items-center gap-1">
                    🏗️ Ses chantiers assignés ({client.chantiers?.length || 0})
                  </p>
                  {(!client.chantiers || client.chantiers.length === 0) ? (
                    <p className="text-xs text-white/40 italic">Aucun chantier assigné</p>
                  ) : (
                    <div className="space-y-2">
                      {client.chantiers.slice(0, 3).map((chantier: any) => {
                        const sante = getSanteChantier(chantier, client.rapports || [], client.paiements || []);
                        return (
                          <Link
                            key={chantier.id}
                            href={`/admin/chantier/${chantier.id}`}
                            className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-[#FF7A00]/10 border border-transparent transition group"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {chantier.nom_projet || chantier.nom || "Sans nom"}
                              </p>
                              <p className="text-xs text-white/50 truncate">
                                {chantier.localisation?.ville || "Localisation inconnue"}
                              </p>
                            </div>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sante.couleur === "green" ? "bg-green-500/20 text-green-400" :
                              sante.couleur === "orange" ? "bg-orange-500/20 text-orange-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {sante.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}