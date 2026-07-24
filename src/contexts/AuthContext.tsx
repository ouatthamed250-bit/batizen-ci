"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getFirebaseServices, hasFirebaseConfig } from "@/lib/firebase";
import { ref, set, get } from "firebase/database";
import { logger } from "@/utils/logger";

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
    return null;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(() => hasFirebaseConfig());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored?.user) {
      logger.debug("✅ Auth: Utilisateur restauré depuis le localStorage");
      setUser(stored.user);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      console.warn("⚠️ FIREBASE : Configuration non détectée. Mode Démo.");
      return;
    }

    const { auth, database } = getFirebaseServices();

    logger.debug("🔄 Auth: Démarrage de onAuthStateChanged...");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      logger.debug("👀 Auth: onAuthStateChanged déclenché. Utilisateur:", firebaseUser ? firebaseUser.email : "NULL");
      
      if (firebaseUser) {
        let userData = null;
        try {
          const snapshot = await get(ref(database, `users/${firebaseUser.uid}`));
          userData = snapshot.val();
        } catch (err) {
          console.error("Erreur lecture DB:", err);
        }
        
        // Si c'est une nouvelle connexion Google, on crée la fiche en base
        if (!userData && firebaseUser.providerData.some(p => p.providerId === 'google.com')) {
          logger.debug("📝 Auth: Création de la fiche utilisateur Google en base de données...");
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

        // 🔒 SÉCURITÉ CRITIQUE : le rôle "admin" ne doit JAMAIS être déterminé par une
        // donnée modifiable côté client (Realtime Database). N'importe quel utilisateur
        // connecté pouvait auparavant écrire users/{uid}/role = "admin" depuis la
        // console du navigateur et obtenir un accès complet aux pages /admin.
        //
        // On se base donc UNIQUEMENT sur le custom claim Firebase "role", qui ne peut
        // être attribué que côté serveur (Firebase Admin SDK / scripts/set-admin-role.js).
        // Un utilisateur ne peut pas falsifier son propre idToken pour s'auto-attribuer
        // ce claim.
        let isAdminClaim = false;
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          isAdminClaim = tokenResult.claims?.role === "admin";
        } catch (err) {
          console.error("Erreur lecture des custom claims:", err);
        }

        const authUser: AuthUser = {
           uid: firebaseUser.uid,
           email: firebaseUser.email,
           displayName: firebaseUser.displayName || userData?.displayName || null,
           photoURL: firebaseUser.photoURL || userData?.photoURL || null,
           phoneNumber: userData?.phoneNumber || firebaseUser.phoneNumber || null,
           role: isAdminClaim ? "admin" : "client",
         };
        logger.debug("✅ Auth: Connexion réussie pour", authUser.email);

        // 🔑 Créer le cookie de session HttpOnly côté serveur (__session)
        // pour que le middleware et les API routes puissent vérifier l'identité.
        try {
          const idToken = await firebaseUser.getIdToken();
          const sessionRes = await fetch("/api/auth/create-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
          if (sessionRes.ok) {
            logger.debug("✅ Auth: Cookie __session créé avec succès");
          } else {
            console.warn("⚠️ Auth: Échec création cookie __session");
          }
        } catch (sessionErr) {
          logger.error("❌ Auth: Erreur création cookie __session:", sessionErr);
        }

        setUser(authUser);
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: authUser }));
      } else {
        logger.debug("❌ Auth: Déconnexion ou aucun utilisateur.");
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    logger.debug("🔑 Auth: Tentative de login avec", email);
    if (!hasFirebaseConfig()) {
      const demoUser: AuthUser = { uid: "demo-user-id", email, displayName: "Utilisateur Démo", photoURL: null, phoneNumber: null };
      setUser(demoUser);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: demoUser }));
      return;
    }
    const { auth } = getFirebaseServices();
    await signInWithEmailAndPassword(auth, email, password);
    logger.debug("✅ Auth: Login email/password réussi");
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    logger.debug("📝 Auth: Tentative d'inscription pour", email, "nom:", name);
    if (!hasFirebaseConfig()) {
      const demoUser: AuthUser = { uid: "demo-user-id", email, displayName: name, photoURL: null, phoneNumber: email?.split('@')[0] || null };
      setUser(demoUser);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: demoUser }));
      return;
    }
    
    try {
      const { auth, database } = getFirebaseServices();
      logger.debug("➡️ Appel de createUserWithEmailAndPassword...");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      logger.debug("✅ Utilisateur créé dans Firebase Auth. UID:", cred.user.uid);
      
      await updateProfile(cred.user, { displayName: name });
      
      const phoneNumber = email?.split('@')[0] || null;
      await set(ref(database, `users/${cred.user.uid}`), {
        uid: cred.user.uid, 
        email: cred.user.email, 
        phoneNumber, 
        displayName: name, 
        role: "client", 
        createdAt: Date.now(),
      });
      logger.debug("✅ Fiche utilisateur créée dans Realtime Database");
    } catch (error: any) {
      console.error("🔥 ERREUR CRITIQUE INSCRIPTION:", error.code, error.message);
      throw error; // ⚠️ C'est crucial : on doit lancer l'erreur pour que la page d'inscription l'affiche
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    logger.debug("🔵 Auth: Tentative de connexion Google (Redirect)...");
    if (!hasFirebaseConfig()) {
      console.error("🚨 ERREUR CRITIQUE : Mode Démo.");
      return;
    }

    try {
      const { auth, googleProvider } = getFirebaseServices();
      const result = await signInWithPopup(auth, googleProvider);
      logger.debug("✅ Auth: Connexion Google (popup) réussie pour", result.user.email);
    } catch (error: any) {
      console.error("🔥 ÉCHEC AUTHENTIFICATION GOOGLE:", error.code, error.message);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    logger.debug("🚪 Auth: Déconnexion...");
    if (hasFirebaseConfig()) {
      const { auth } = getFirebaseServices();
      await signOut(auth);
    }
    // 🔒 Supprime aussi le cookie de session serveur HttpOnly (__session).
    // Sans cet appel, le cookie reste valide jusqu'à son expiration (24h)
    // même après une "déconnexion" côté client, laissant l'accès /admin ouvert.
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Erreur suppression session serveur:", err);
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
