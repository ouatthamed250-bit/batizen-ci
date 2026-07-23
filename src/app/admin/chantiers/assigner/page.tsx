'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HardHat, Clock, CheckCircle2, Search } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useChantiers } from '@/hooks/useChantiers';
import type { Chantier } from '@/types/chantier';
import { formatDateCourte, formatLocalisation } from '@/utils/formatters';

export default function AssignerChantierPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { getChantiersEnAttente, assignerChantier, loading } = useChantiers();
  const [chantiersEnAttente, setChantiersEnAttente] = useState<Chantier[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadChantiers = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    
    const chantiers = await getChantiersEnAttente();
    setChantiersEnAttente(chantiers);
    setPageLoading(false);
  }, [user, getChantiersEnAttente]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'admin') {
      router.push('/login?redirect=admin/chantiers/assigner');
      return;
    }

    loadChantiers();
  }, [user, authLoading, router, loadChantiers]);

  const handleAssigner = async (chantierId: string) => {
    if (!user?.uid) return;
    
    setAssigningId(chantierId);
    setSuccessMessage(null);

    const success = await assignerChantier(chantierId, user.uid);

    if (success) {
      setSuccessMessage(`✅ Chantier ${chantierId.slice(0, 10)}... assigné avec succès !`);
      // Mettre à jour la liste locale
      setChantiersEnAttente((prev) => prev.filter((c) => c.id !== chantierId));
    }

    setAssigningId(null);
  };

  // Filtrer les chantiers par recherche
  const filteredChantiers = chantiersEnAttente.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.nom || '').toLowerCase().includes(term) ||
      (c.nom_projet || '').toLowerCase().includes(term) ||
      (c.type || '').toLowerCase().includes(term) ||
      (c.localisation?.ville || '').toLowerCase().includes(term)
    );
  });

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des chantiers en attente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[var(--navy)] mb-2">
          📋 Assignation des chantiers
        </h1>
        <p className="text-gray-600">
          Prenez en charge les nouveaux chantiers en attente d'assignation.
        </p>
      </div>

      {/* Message de succès */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 font-semibold flex items-center gap-2">
          <CheckCircle2 size={20} />
          {successMessage}
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
          placeholder="Rechercher un chantier par nom, type ou ville..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/50 focus:border-[#FF7A00] transition shadow-sm"
        />
      </div>

      {/* Indicateur de charge */}
      {loading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
          Mise à jour en cours...
        </div>
      )}

      {/* Liste des chantiers en attente */}
      {filteredChantiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[28px] bg-white border border-gray-200 shadow-sm">
          <div className="grid size-20 place-items-center rounded-full bg-green-100 text-green-500 mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">
            Aucun chantier en attente
          </h2>
          <p className="text-sm text-gray-500 max-w-xs">
            Tous les chantiers ont été pris en charge. Revenez plus tard.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredChantiers.map((chantier) => (
            <div
              key={chantier.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-[var(--navy)] text-lg truncate">
                    {chantier.nom_projet || chantier.nom || 'Chantier sans nom'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                      <Clock size={12} />
                      En attente
                    </span>
                    <span className="text-xs text-gray-500">
                      🏗️ {chantier.type || 'Non spécifié'}
                    </span>
                    <span className="text-xs text-gray-500">
                      📍 {formatLocalisation(chantier.localisation) || 'Localisation inconnue'}
                    </span>
                  </div>
                  {chantier.dateCreation && (
                    <p className="text-xs text-gray-400 mt-2">
                      📅 Soumis le {formatDateCourte(chantier.dateCreation.toString())}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleAssigner(chantier.id)}
                    disabled={assigningId === chantier.id}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${
                      assigningId === chantier.id
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#FF7A00] text-white hover:bg-[#E66E00] shadow-sm hover:shadow-md'
                    }`}
                  >
                    {assigningId === chantier.id ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Assignation...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <HardHat size={16} />
                        Prendre en charge
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <Link
                  href={`/admin/chantier/${chantier.id}`}
                  className="text-xs font-semibold text-[#FF7A00] hover:text-[#E66E00] transition"
                >
                  Voir les détails →
                </Link>
                <span className="text-xs text-gray-400">
                  ID: {chantier.id.slice(0, 12)}...
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}