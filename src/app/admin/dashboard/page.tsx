'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDatabase, ref, onValue, get } from 'firebase/database';

type Localisation = {
  adresse?: string;
  commune?: string;
  quartier?: string;
  ville?: string;
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
  dateCreation?: number;
  type?: string;
  budget?: number;
  plan_choisi?: string;
  date_soumission?: string;
  localisation?: Localisation;
  client_nom?: string;
  client_email?: string;
  client_telephone?: string;
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
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // 🔒 Vérification de sécurité côté client basée sur le rôle réel (custom claim
    // Firebase), et non plus sur des cookies non-HttpOnly falsifiables depuis la
    // console du navigateur. La protection serveur est assurée par le middleware.
    if (authLoading) return;

    if (!user || user.role !== "admin") {
      router.push('/login?redirect=admin');
      return;
    }

    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const chantiersRef = ref(db, 'chantiers');
    const rapportsRef = ref(db, 'rapports');
    const paiementsRef = ref(db, 'paiements');

    const loadClientsWithChantiers = async () => {
      const usersSnap = await get(usersRef);
      const usersData = usersSnap.val() || {};
      
      const chantiersSnap = await get(chantiersRef);
      const allChantiers = chantiersSnap.val() || {};
      
      const rapportsSnap = await get(rapportsRef);
      const allRapports = Object.entries(rapportsSnap.val() || {}).map(([id, r]: [string, any]) => ({ id, ...r }));
      
      const paiementsSnap = await get(paiementsRef);
      const allPaiements = Object.entries(paiementsSnap.val() || {}).map(([id, p]: [string, any]) => ({ id, ...p }));

      const clientsList = Object.entries(usersData)
        .filter(([id, u]: [string, any]) => (u.role || u.userRole) === "client")
        .map(([id, u]: [string, any]) => ({
          id,
          ...u,
          displayName: u.displayName || u.nom || "Sans nom"
        }));

      const clientsWithChantiers = clientsList.map((client) => {
        const clientChantiers = Object.entries(allChantiers)
          .filter(([_, c]: [string, any]) => c.userId === client.id || c.client_id === client.id)
          .map(([id, c]: [string, any]) => ({ id, ...c }));
        
        const clientRapports = allRapports.filter((r: any) => 
          clientChantiers.some(ch => ch.id === r.chantierId)
        );
        
        const clientPaiements = allPaiements.filter((p: any) => 
          clientChantiers.some(ch => ch.id === p.chantierId)
        );

        return { ...client, chantiers: clientChantiers, rapports: clientRapports, paiements: clientPaiements };
      });

      setClients(clientsWithChantiers);
      setLoading(false);
    };

    loadClientsWithChantiers();

    return () => {};
  }, [user, router]);

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
        <p className="text-gray-600">Vue d'ensemble opérationnelle de vos chantiers et clients</p>
      </div>

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

      {/* Section Clients avec chantiers */}
      <div className="space-y-4">
        {clients
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
                🏗️ Ses chantiers ({client.chantiers?.length || 0})
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
        ))}
      </div>
    </div>
  );
}