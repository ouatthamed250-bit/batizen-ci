/**
 * Hook `useAuth` — État d'authentification Firebase unifié.
 *
 * Retourne :
 * - user : AuthUser | null — l'utilisateur connecté (uid, email, displayName, role)
 * - loading : boolean — true tant que l'état n'est pas résolu
 * - isAdmin : boolean — true si l'utilisateur a le rôle admin
 *
 * Vérification du rôle admin (sécurité renforcée) :
 * 1. Custom claim Firebase via getIdTokenResult() (serveur, infalsifiable)
 * 2. API serveur /api/auth/check-admin (whitelist serveur)
 *
 * ⚠️ SÉCURITÉ : La vérification via Realtime Database côté client a été
 *    supprimée car elle permettait à un utilisateur de s'auto-attribuer
 *    le rôle admin en écrivant users/{uid}/role = "admin" depuis la console.
 *
 * Si l'une des deux sources confirme "admin", isAdmin = true.
 *
 * Utilisation :
 *   import { useAuth } from '@/hooks/useAuth';
 *   const { user, loading, isAdmin } = useAuth();
 */

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { getFirebaseServices, hasFirebaseConfig } from '@/lib/firebase';
import { logger } from '@/utils/logger';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'client';
};

/**
 * Hook d'authentification Firebase unifié.
 * Source de vérité unique pour toute l'auth.
 *
 * Retourne :
 * - user : AuthUser | null
 * - loading : boolean
 * - error : string | null
 * - isAdmin : boolean
 * - isAuthenticated : boolean
 * - login(email, password) : Promise<void>
 * - register(email, password, name) : Promise<void>
 * - loginWithGoogle() : Promise<void>
 * - logout() : Promise<void>
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const isAuthenticated = user !== null;

  useEffect(() => {
    const { auth } = getFirebaseServices();

    if (!auth || !hasFirebaseConfig()) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const [tokenResult, idToken] = await Promise.allSettled([
        firebaseUser.getIdTokenResult(),
        firebaseUser.getIdToken(),
      ]);

      const isAdminClaim = tokenResult.status === 'fulfilled' 
        ? tokenResult.value.claims?.role === 'admin' 
        : false;

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
        } catch {
          // Silencieux — échec de la vérification serveur non bloquant
        }
      }

      const finalIsAdmin = isAdminClaim || isAdminServer;

      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: finalIsAdmin ? 'admin' : 'client',
      };

      setUser(authUser);
      setIsAdmin(finalIsAdmin);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setError(null);
    const { auth } = getFirebaseServices();
    if (!auth || !hasFirebaseConfig()) {
      throw new Error('Firebase non configuré');
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(message);
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<void> => {
    setError(null);
    const { auth, database } = getFirebaseServices();
    if (!auth || !hasFirebaseConfig()) {
      throw new Error('Firebase non configuré');
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await set(ref(database, `users/${cred.user.uid}`), {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name,
        role: 'client',
        createdAt: Date.now(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      setError(message);
      throw err;
    }
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<void> => {
    setError(null);
    const { auth, googleProvider } = getFirebaseServices();
    if (!auth || !googleProvider || !hasFirebaseConfig()) {
      throw new Error('Firebase non configuré');
    }
    try {
      const { database } = getFirebaseServices();
      const result = await signInWithPopup(auth, googleProvider);

      const snapshot = await get(ref(database, `users/${result.user.uid}`));
      if (!snapshot.exists()) {
        await set(ref(database, `users/${result.user.uid}`), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || 'Utilisateur Google',
          photoURL: result.user.photoURL || null,
          role: 'client',
          createdAt: Date.now(),
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur connexion Google';
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setError(null);
    const { auth } = getFirebaseServices();
    if (auth && hasFirebaseConfig()) {
      await signOut(auth);
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Silencieux
    }
    setUser(null);
    setIsAdmin(false);
  }, []);

  return { user, loading, error, isAdmin, isAuthenticated, login, register, loginWithGoogle, logout };
}
