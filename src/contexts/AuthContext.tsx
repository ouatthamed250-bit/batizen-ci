"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect, // ✅ REMPLACÉ : On utilise la redirection au lieu du popup
  signOut,
  updateProfile,
} from "firebase/auth";
import { getFirebaseServices, hasFirebaseConfig } from "@/lib/firebase";
import { ref, set, get } from "firebase/database";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role?: "client" | "admin";
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "batizen_auth_persist";

function getStoredAuth(): { user: AuthUser } | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.user) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(() => hasFirebaseConfig());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Hydratation depuis localStorage
  useEffect(() => {
    const stored = getStoredAuth();
    if (stored?.user) {
      setUser(stored.user);
      setIsAuthenticated(true);
    }
  }, []);

  // Écouteur d'état d'authentification Firebase
  useEffect(() => {
    if (!hasFirebaseConfig()) {
      console.warn("⚠️ FIREBASE : Configuration non détectée. Mode Démo activé.");
      return;
    }

    const { auth, database } = getFirebaseServices();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let userData = null;
        try {
          const snapshot = await get(ref(database, `users/${firebaseUser.uid}`));
          userData = snapshot.val();
        } catch {
          // ignore
        }
        
        // Si l'utilisateur vient de se connecter via Google et n'a pas de données en base, on les crée
        if (!userData && firebaseUser.providerData.some(p => p.providerId === 'google.com')) {
          await set(ref(database, `users/${firebaseUser.uid}`), {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || "Utilisateur Google",
            photoURL: firebaseUser.photoURL || null,
            role: "client",
            createdAt: Date.now(),
          });
          userData = { role: "client", createdAt: Date.now() };
        }
        
        const authUser: AuthUser = {
           uid: firebaseUser.uid,
           email: firebaseUser.email,
           displayName: firebaseUser.displayName || userData?.displayName || null,
           photoURL: firebaseUser.photoURL || userData?.photoURL || null,
           phoneNumber: userData?.phoneNumber || firebaseUser.phoneNumber || null,
           role: userData?.role || "client",
         };
        setUser(authUser);
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: authUser }));
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!hasFirebaseConfig()) {
      const demoUser: AuthUser = { uid: "demo-user-id", email, displayName: "Utilisateur Démo", photoURL: null, phoneNumber: null };
      setUser(demoUser);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: demoUser }));
      return;
    }
    const { auth } = getFirebaseServices();
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    if (!hasFirebaseConfig()) {
      const demoUser: AuthUser = { uid: "demo-user-id", email, displayName: name, photoURL: null, phoneNumber: email?.split('@')[0] || null };
      setUser(demoUser);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: demoUser }));
      return;
    }
    const { auth, database } = getFirebaseServices();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    
    const phoneNumber = email?.split('@')[0] || null;
    await set(ref(database, `users/${cred.user.uid}`), {
      uid: cred.user.uid, email: cred.user.email, phoneNumber, displayName: name, role: "client", createdAt: Date.now(),
    });
  }, []);

  // ✅ CORRECTION GOOGLE : Utilisation de la redirection pour éviter les blocages navigateur
  const loginWithGoogle = useCallback(async () => {
    if (!hasFirebaseConfig()) {
      console.error("🚨 ERREUR CRITIQUE : Tentative de connexion Google en Mode Démo.");
      const demoUser: AuthUser = { uid: "demo-google-user-id", email: "user@gmail.com", displayName: "Utilisateur Google (Démo)", photoURL: null, phoneNumber: null };
      setUser(demoUser);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: demoUser }));
      return;
    }

    try {
      const { auth, googleProvider } = getFirebaseServices();
      
      // La redirection est beaucoup plus stable que le popup sur mobile et Chrome récent
      await signInWithRedirect(auth, googleProvider);
      
      // Note : Après la redirection, le "onAuthStateChanged" ci-dessus détectera 
      // automatiquement l'utilisateur et écrira ses données en base si nécessaire.
      
    } catch (error: any) {
      console.error("🔥 ÉCHEC AUTHENTIFICATION GOOGLE :", error.code, error.message);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    if (hasFirebaseConfig()) {
      const { auth } = getFirebaseServices();
      await signOut(auth);
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}