"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AdminLayoutClient from "./AdminLayoutClient";

/**
 * Layout admin — Client Component
 *
 * 🔒 Vérification de l'accès admin via le hook useAuth().
 * Le hook vérifie le rôle admin via :
 * 1. Custom Claim Firebase (getIdTokenResult — infalsifiable, côté serveur)
 * 2. API serveur /api/auth/check-admin (whitelist serveur + firebase-admin)
 *
 * ⚠️ SÉCURITÉ : La vérification via Realtime Database seule a été supprimée car
 *    elle permettait l'auto-attribution du rôle. Les sources serveur restent la
 *    référence (cf. database.rules.json pour le déploiement des règles).
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