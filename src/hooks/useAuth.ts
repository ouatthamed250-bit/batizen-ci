/**
 * Hook `useAuth` — État d'authentification Firebase unifié.
 *
 * Retourne :
 * - user : AuthUser | null — l'utilisateur connecté (uid, email, displayName, role)
 * - loading : boolean — true tant que l'état n'est pas résolu
 * - isAdmin : boolean — true si l'utilisateur a le rôle admin
 *
 * Vérification du rôle admin (double sécurité) :
 * 1. Custom claim Firebase via getIdTokenResult()
 * 2. Realtime Database via users/{uid}/role
 *
 * Si l'une des deux sources confirme "admin", isAdmin = true.
 *
 * Utilisation :
 *   import { useAuth } from '@/hooks/useAuth';
 *   const { user, loading, isAdmin } = useAuth();
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { getFirebaseServices } from '@/lib/firebase';
import { logger } from '@/utils/logger';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'client';
};

/**
 * Hook d'authentification Firebase.
 * Se met à jour automatiquement via onAuthStateChanged.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { auth, db } = getFirebaseServices();

    // Vérifie si Firebase est configuré
    if (!auth) {
      console.warn('⚠️ useAuth: Firebase non configuré, mode démo');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        logger.debug('❌ useAuth: Aucun utilisateur connecté');
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      logger.debug('👤 useAuth: Utilisateur connecté —', firebaseUser.email);

      // ── 1. Vérification du custom claim (source serveur infalsifiable) ──
      let isAdminClaim = false;
      try {
        const tokenResult = await firebaseUser.getIdTokenResult();
        isAdminClaim = tokenResult.claims?.role === 'admin';
      } catch (err) {
        logger.error('❌ useAuth: Erreur lecture custom claims:', err);
      }

      // ── 2. Vérification fallback Realtime Database ──
      // Utile pour les admins créés via /make-me-admin qui n'ont pas
      // encore de custom claim mais ont le rôle "admin" dans la DB.
      let isAdminDb = false;
      try {
        const userRef = ref(db, `users/${firebaseUser.uid}/role`);
        const snapshot = await get(userRef);
        if (snapshot.exists() && snapshot.val() === 'admin') {
          isAdminDb = true;
        }
      } catch (err) {
        logger.error('❌ useAuth: Erreur lecture DB role:', err);
      }

      // ── Admin si l'une des deux sources est vraie ──
      const finalIsAdmin = isAdminClaim || isAdminDb;

      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: finalIsAdmin ? 'admin' : 'client',
      };

      logger.debug(
        `✅ useAuth: ${authUser.email} — rôle: ${authUser.role}` +
        ` (custom claim: ${isAdminClaim}, DB: ${isAdminDb})`
      );

      setUser(authUser);
      setIsAdmin(finalIsAdmin);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, isAdmin };
}