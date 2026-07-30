"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

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

/**
 * Provider d'authentification — proxy autour de useAuth().
 * Toute la logique Firebase est déléguée au hook useAuth (source de vérité unique).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading, error, isAdmin, isAuthenticated, login, register, loginWithGoogle, logout } = useAuth();

  // Mapping pour préserver l'interface AuthContextType existante
  const contextUser: AuthUser | null = user
    ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: null,
        role: user.role,
      }
    : null;

  const value: AuthContextType = {
    user: contextUser,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
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
