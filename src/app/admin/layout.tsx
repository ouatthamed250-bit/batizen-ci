"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AdminLayoutClient from "./AdminLayoutClient";

/**
 * Layout admin — Client Component
 *
 * 🔒 Vérification côté client de l'accès admin via le hook useAuth().
 * L'utilisateur doit avoir le rôle "admin" dans la Realtime Database.
 *
 * Architecture simplifiée :
 * - Plus de vérification côté serveur (cookies, firebase-admin)
 * - Plus de middleware
 * - Vérification 100% côté client via Firebase Auth + Realtime Database
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && !isAdmin) {
      router.push("/");
    }
  }, [loading, user, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827] text-white">
        <div className="text-center">
          <div className="mb-4 text-2xl font-black">BÂTIZEN Admin</div>
          <div className="text-sm text-white/70">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}