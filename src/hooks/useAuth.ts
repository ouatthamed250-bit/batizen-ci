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

      // ── Vérifications admin en parallèle ──
      const [tokenResult, dbSnapshot, idToken] = await Promise.allSettled([
        firebaseUser.getIdTokenResult(),
        get(ref(db, `users/${firebaseUser.uid}/role`)),
        firebaseUser.getIdToken(),
      ]);

      const isAdminClaim = tokenResult.status === 'fulfilled' 
        ? tokenResult.value.claims?.role === 'admin' 
        : false;

      const isAdminDb = dbSnapshot.status === 'fulfilled' 
        ? dbSnapshot.value.exists() && dbSnapshot.value.val() === 'admin' 
        : false;

      // ── Vérification serveur (whitelist) ──
      let isAdminServer = false;
      if (idToken.status === 'fulfilled') {
        try {
          const res = await fetch('/api/auth/check-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: idToken.value }),
          });
          if (res.ok) {
            const data = await res.json();
            isAdminServer = data.isAdmin;
          }
        } catch (err) {
          logger.error('❌ useAuth: Erreur vérification serveur admin:', err);
        }
      }

      // ── Admin si l'une des trois sources est vraie ──
      const finalIsAdmin = isAdminClaim || isAdminDb || isAdminServer;

      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: finalIsAdmin ? 'admin' : 'client',
      };

      logger.debug(
        `✅ useAuth: ${authUser.email} — rôle: ${authUser.role}` +
        ` (custom claim: ${isAdminClaim}, DB: ${isAdminDb}, serveur: ${isAdminServer})`
      );

      setUser(authUser);
      setIsAdmin(finalIsAdmin);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, isAdmin };
}