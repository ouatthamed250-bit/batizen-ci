'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, HardHat, Clock, CheckCircle2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useChantiers } from '@/hooks/useChantiers';
import type { Chantier } from '@/types/chantier';
import { formatDateCourte } from '@/utils/formatters';
import { getFirebaseServices } from '../../../lib';

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

// Fonction utilitaire de calcul de santé
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

  const loadDashboard = useCallback(async () => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      router.push('/login?redirect=admin');
      return;
    }

    const { db: db } = getFirebaseServices();
    const usersRef = ref(db, 'users');
    const chantiersRef = ref(db, 'chantiers');
    const rapportsRef = ref(db, 'rapports');
    const paiementsRef = ref(db, 'paiements');

    try {
      const [usersSnap, chantiersSnap, rapportsSnap, paiementsSnap] = await Promise.all([
        get(usersRef),
        get(chantiersRef),
        get(rapportsRef),
        get(paiementsRef),
      ]);

      const usersData = usersSnap.val() || {};
      const allChantiers = chantiersSnap.val() || {};
      const allRapports = Object.entries(rapportsSnap.val() || {}).map(([id, r]: [string, any]) => ({ id, ...r }));
      const allPaiements = Object.entries(paiementsSnap.val() || {}).map(([id, p]: [string, any]) => ({ id, ...p }));

      // 🔒 FILTRE ADMIN : ne montrer que les chantiers assignés à CET admin
      // + les chantiers en attente (sans adminId) dans une section dédiée
      const chantiersList = Object.entries(allChantiers).map(([id, c]: [string, any]) => ({
        id,
        ...c,
      })) as Chantier[];

      // Chantiers en attente (sans admin) — visibles par tous les admins
      const enAttente = chantiersList.filter(
        (c) => !c.adminId || c.adminId.length === 0
      );
      setChantiersEnAttente(enAttente);

      // Chantiers assignés à CET admin uniquement
      const mesChantiers = chantiersList.filter(
        (c) => c.adminId === user.uid
      );

      // Filtrer les clients qui ont au moins un chantier assigné à cet admin
      const clientsList = Object.entries(usersData)
        .filter(([id, u]: [string, any]) => (u.role || u.userRole) === "client")
        .map(([id, u]: [string, any]) => ({
          id,
          ...u,
          displayName: u.displayName || u.nom || "Sans nom"
        }));

      const clientsWithChantiers = clientsList.map((client) => {
        // Ne montrer que les chantiers assignés à cet admin pour ce client
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
      // Déplacer le chantier de la section "en attente" vers "mes chantiers"
      const chantier = chantiersEnAttente.find((c) => c.id === chantierId);
      setChantiersEnAttente((prev) => prev.filter((c) => c.id !== chantierId));
      if (chantier) {
        // Recharger pour voir le chantier apparaître dans la section assignée
        loadDashboard();
      }
    }
    setAssigningId(null);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* En-tête Dashboard */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[var(--navy)] mb-2">
          🏗️ Dashboard Principal BÂTIZEN CI
        </h1>
        <p className="text-gray-600">
          Bienvenue, {user?.displayName || user?.email}. Voici vos chantiers assignés.
        </p>
      </div>

      {/* SECTION : Chantiers en attente d'assignation */}
      {chantiersEnAttente.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-[var(--navy)] flex items-center gap-2">
              <Clock size={24} className="text-amber-500" />
              Chantiers en attente d'assignation
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
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
                className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--navy)] truncate">
                    {chantier.nom_projet || chantier.nom || 'Chantier sans nom'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {chantier.type || 'Non spécifié'} — {chantier.localisation?.ville || 'Localisation inconnue'}
                  </p>
                  {chantier.dateCreation && (
                    <p className="text-xs text-gray-400">
                      Soumis le {formatDateCourte(chantier.dateCreation.toString())}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleAssigner(chantier.id)}
                  disabled={assigningId === chantier.id}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition ${
                    assigningId === chantier.id
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
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

      {/* Barre de recherche */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par nom, email ou téléphone..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/50 focus:border-[#FF7A00] transition shadow-sm"
        />
      </div>

      {/* Section Clients avec chantiers (filtrés par admin connecté) */}
      <div className="space-y-4">
        {clients.filter((client) => {
          if (!searchTerm.trim()) return true;
          const term = searchTerm.toLowerCase();
          return (client.displayName || "").toLowerCase().includes(term) ||
                 (client.email || "").toLowerCase().includes(term);
        }).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-[28px] bg-white border border-gray-200 shadow-sm">
            <div className="grid size-16 place-items-center rounded-full bg-gray-100 text-gray-400 mb-4">
              <HardHat size={32} />
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-2">
              Aucun chantier assigné
            </h2>
            <p className="text-sm text-gray-500 max-w-xs">
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
              <div key={client.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#FF7A00]/10 flex items-center justify-center text-[#FF7A00] font-black text-lg">
                    {(client.displayName || "CL").charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--navy)]">{client.displayName || "Sans nom"}</h4>
                    <p className="text-xs text-gray-500">{client.email || "—"}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    🏗️ Ses chantiers assignés ({client.chantiers?.length || 0})
                  </p>

                  {(!client.chantiers || client.chantiers.length === 0) ? (
                    <p className="text-xs text-gray-400 italic">Aucun chantier assigné</p>
                  ) : (
                    <div className="space-y-2">
                      {client.chantiers.slice(0, 3).map((chantier: any) => {
                        const sante = getSanteChantier(chantier, client.rapports || [], client.paiements || []);

                        return (
                          <Link
                            key={chantier.id}
                            href={`/admin/chantier/${chantier.id}`}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-[#FF7A00]/5 border border-transparent transition group"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--navy)] truncate">
                                {chantier.nom_projet || chantier.nom || "Sans nom"}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {chantier.localisation?.ville || "Localisation inconnue"}
                              </p>
                            </div>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sante.couleur === "green" ? "bg-green-100 text-green-700" :
                              sante.couleur === "orange" ? "bg-orange-100 text-orange-700" :
                              "bg-red-100 text-red-700"
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
