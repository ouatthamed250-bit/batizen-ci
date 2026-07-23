"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, UserRound, LogOut } from "lucide-react";
import { imagePaths } from "@/lib/helpers";
import { useAuthContext } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function PremiumHeader() {
  const { user, logout } = useAuthContext();
  const router = useRouter();

  async function handleLogout() {
    try {
      // logout() gère désormais aussi la suppression du cookie de session
      // serveur HttpOnly (__session) via /api/auth/logout.
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  }

  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <header className="sticky top-4 z-40 mx-2 mb-6 flex h-16 items-center justify-between rounded-[28px] border border-white/50 bg-white/80 px-4 shadow-[0_14px_44px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-[#1E3A6E] dark:bg-[#1E1E2E]/80 dark:shadow-[0_14px_44px_rgba(0,0,0,0.3)]">
      
      {/* LOGO */}
      <Link className="flex items-center gap-3" href="/dashboard" aria-label="Accueil BÂTIZEN CI">
        <Image alt="Logo BÂTIZEN CI" className="rounded-2xl" height={40} priority src={imagePaths.logo} width={40} />
        <span className="hidden text-base font-black tracking-tight dark:text-[#F0F4FF] text-gray-900 sm:inline">BÂTIZEN CI</span>
      </Link>

      {/* BOUTONS D'ACTION */}
      <nav className="flex items-center gap-2" aria-label="Actions rapides">
        {user?.displayName && (
          <span className="hidden text-sm font-bold dark:text-[#F0F4FF] text-gray-600 md:inline">
            {user.displayName.split(" ")[0]} 👋
          </span>
        )}

        {/* 1. BOUTON DARK MODE (Fonctionnel via ThemeToggle) */}
        <ThemeToggle />

        {/* 2. BOUTON NOTIFICATIONS (Redirige vers /notifications) */}
        <Link
          className="relative grid size-11 place-items-center rounded-full bg-[#F7F9FC] text-[#111827] transition hover:bg-[#E7EBF5] active:scale-95 dark:bg-[#1E3A6E] dark:text-[#F0F4FF] dark:hover:bg-[#3B7FFF]/20"
          href="/notifications"
          aria-label="Notifications"
        >
          <Bell size={21} aria-hidden />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-[#FF7A00] shadow-sm" aria-hidden />
        </Link>

        {/* 3. BOUTON PROFIL (Redirige vers /profil) */}
        <Link
          className="grid size-11 place-items-center overflow-hidden rounded-full bg-[#0B5FFF] text-white shadow-[0_10px_24px_rgba(11,95,255,0.28)] transition hover:bg-[#0D2B6B] active:scale-95 dark:bg-[#3B7FFF] dark:hover:bg-[#4B8FFF]"
          href="/profil"
          aria-label="Mon profil"
        >
          {user?.photoURL ? (
            <Image src={user.photoURL} alt={user.displayName ?? "Profil"} width={44} height={44} loading="lazy" className="size-full object-cover" />
          ) : (
            <span className="text-sm font-black">{initials}</span>
          )}
        </Link>

        {/* 4. BOUTON DÉCONNEXION (Réparé) */}
        <button
          onClick={handleLogout}
          aria-label="Se déconnecter"
          className="grid size-11 place-items-center rounded-full bg-[#F7F9FC] text-[#6B7280] transition hover:bg-red-50 hover:text-red-500 active:scale-95 dark:bg-[#0D2B6B] dark:text-white dark:hover:bg-red-900/30 dark:hover:text-red-400"
        >
          <LogOut size={21} aria-hidden />
        </button>
      </nav>
    </header>
  );
}