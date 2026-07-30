import { useState, useCallback } from 'react';
import { ref, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { getFirebaseServices } from '@/lib/firebase';
import type { Chantier } from '@/types/chantier';

type DonneesBrutes = Record<string, unknown>;

function normaliserChantier([id, c]: [string, DonneesBrutes]): Chantier {
  return { id, ...c } as Chantier;
}

/**
 * Hook centralisé pour la gestion des chantiers avec la relation Admin-Client.
 *
 * Fournit :
 * - getChantiersByAdmin(adminId: string) → chantiers assignés à un admin
 * - getChantiersEnAttente() → chantiers sans adminId (à assigner)
 * - getChantiersByClient(clientId: string) → chantiers d'un client
 * - assignerChantier(chantierId: string, adminId: string) → assigne un admin à un chantier
 */
export function useChantiers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function lireMessage(err: unknown): string {
    return err instanceof Error ? err.message : "Erreur inconnue";
  }

  /**
   * Récupère tous les chantiers d'un coup (recommandé pour les dashboards)
   * et les trie automatiquement.
   */
  const getAllChantiers = useCallback(async (): Promise<{
    assignes: Chantier[];
    enAttente: Chantier[];
  }> => {
    setLoading(true);
    setError(null);

    try {
      const { database } = getFirebaseServices();
      const chantiersRef = ref(database, 'chantiers');
      const snapshot = await get(chantiersRef);
      const data = (snapshot.val() as Record<string, DonneesBrutes> | null) || {};

      const chantiers: Chantier[] = Object.entries(data).map(normaliserChantier);

      const assignes = chantiers.filter((c) => c.adminId && c.adminId.length > 0);
      const enAttente = chantiers.filter((c) => !c.adminId || c.adminId.length === 0);

      return { assignes, enAttente };
    } catch (err: unknown) {
      const message = lireMessage(err);
      setError(message);
      return { assignes: [], enAttente: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère les chantiers assignés à un admin spécifique.
   */
  const getChantiersByAdmin = useCallback(async (adminId: string): Promise<Chantier[]> => {
    if (!adminId) return [];

    setLoading(true);
    setError(null);

    try {
      const { database } = getFirebaseServices();
      const chantiersRef = ref(database, 'chantiers');
      const q = query(chantiersRef, orderByChild('adminId'), equalTo(adminId));
      const snapshot = await get(q);
      const data = (snapshot.val() as Record<string, DonneesBrutes> | null) || {};

      return Object.entries(data).map(normaliserChantier);
    } catch (err: unknown) {
      const message = lireMessage(err);
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère les chantiers en attente d'assignation (sans adminId).
   */
  const getChantiersEnAttente = useCallback(async (): Promise<Chantier[]> => {
    setLoading(true);
    setError(null);

    try {
      const { database } = getFirebaseServices();
      const chantiersRef = ref(database, 'chantiers');
      const snapshot = await get(chantiersRef);
      const data = (snapshot.val() as Record<string, DonneesBrutes> | null) || {};

      return Object.entries(data)
        .filter(([_, c]: [string, DonneesBrutes]) => !c.adminId || String(c.adminId).length === 0)
        .map(normaliserChantier);
    } catch (err: unknown) {
      const message = lireMessage(err);
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère les chantiers d'un client spécifique (par userId ou client_id).
   */
  const getChantiersByClient = useCallback(async (clientId: string): Promise<Chantier[]> => {
    if (!clientId) return [];

    setLoading(true);
    setError(null);

    try {
      const { database } = getFirebaseServices();
      const chantiersRef = ref(database, 'chantiers');
      const snapshot = await get(chantiersRef);
      const data = (snapshot.val() as Record<string, DonneesBrutes> | null) || {};

      return Object.entries(data)
        .filter(([_, c]: [string, DonneesBrutes]) => c.userId === clientId || c.client_id === clientId)
        .map(normaliserChantier);
    } catch (err: unknown) {
      const message = lireMessage(err);
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Assigne un admin à un chantier.
   * Met à jour adminId et assignedAt dans Firebase.
   */
  const assignerChantier = useCallback(async (
    chantierId: string,
    adminId: string
  ): Promise<boolean> => {
    if (!chantierId || !adminId) {
      setError('chantierId et adminId sont requis');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { database } = getFirebaseServices();
      const chantierRef = ref(database, `chantiers/${chantierId}`);

      await update(chantierRef, {
        adminId,
        assignedAt: new Date().toISOString(),
      });

      return true;
    } catch (err: unknown) {
      const message = lireMessage(err);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getAllChantiers,
    getChantiersByAdmin,
    getChantiersEnAttente,
    getChantiersByClient,
    assignerChantier,
    loading,
    error,
  };
}
