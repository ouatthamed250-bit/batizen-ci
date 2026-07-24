"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { Bell, UserRound, LogOut } from "lucide-react";
import { imagePaths } from "@/lib/helpers";
import { useAuthContext } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import AdminSecretModal from "@/components/auth/AdminSecretModal";

export function PremiumHeader() {
  const { user, logout } = useAuthContext();
  const router = useRouter();

  // ── Mécanisme secret "5 taps" pour ouvrir le modal admin ──
  // Même logique que sur login/page.tsx : 5 taps rapides (< 2s) sur le logo
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const handleLogoTap = useCallback(() => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (tapTimer) clearTimeout(tapTimer);
    const t = setTimeout(() => { setTapCount(0); }, 2000);
    setTapTimer(t);
    if (newCount >= 5) {
      setTapCount(0);
      if (tapTimer) clearTimeout(tapTimer);
      setShowAdminModal(true);
    }
  }, [tapCount, tapTimer]);

  async function handleLogout() {
    try {
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
    <>
      <AdminSecretModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />

      <header className="sticky top-4 z-40 mx-2 mb-6 flex h-16 items-center justify-between rounded-[28px] border border-white/50 bg-white/80 px-4 shadow-[0_14px_44px_rgba(16,24,40,0.08)] backdrop-blur-xl dark:border-[#1E3A6E] dark:bg-[#0D1B3E]/80 dark:shadow-[0_14px_44px_rgba(0,0,0,0.3)]">
        
        {/* LOGO — 5 taps rapides pour ouvrir le modal admin secret */}
        <Link className="flex items-center gap-3" href="/dashboard" aria-label="Accueil BÂTIZEN CI">
          <Image
            alt="Logo BÂTIZEN CI"
            className="rounded-2xl cursor-pointer"
            height={40}
            priority
            src={imagePaths.logo}
            width={40}
            onClick={handleLogoTap}
          />
          <span className="hidden text-base font-black tracking-tight text-[#0D2B6B] dark:text-[#F0F4FF] sm:inline">BÂTIZEN CI</span>
        </Link>

        {/* BOUTONS D'ACTION */}
        <nav className="flex items-center gap-2" aria-label="Actions rapides">
          {user?.displayName && (
            <span className="hidden text-sm font-bold text-[#0D2B6B] dark:text-[#F0F4FF] md:inline">
              {user.displayName.split(" ")[0]} 👋
            </span>
          )}

          <ThemeToggle />

          <Link
            className="relative grid size-11 place-items-center rounded-full bg-[#F7F9FC] text-[#111827] transition hover:bg-[#E7EBF5] active:scale-95 dark:bg-[#1E3A6E] dark:text-[#F0F4FF] dark:hover:bg-[#3B7FFF]/20"
            href="/notifications"
            aria-label="Notifications"
          >
            <Bell size={21} aria-hidden />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-[#FF7A00] shadow-sm" aria-hidden />
          </Link>

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

          <button
            onClick={handleLogout}
            aria-label="Se déconnecter"
            className="grid size-11 place-items-center rounded-full bg-[#F7F9FC] text-[#6B7280] transition hover:bg-red-50 hover:text-red-500 active:scale-95 dark:bg-[#0D2B6B] dark:text-white dark:hover:bg-red-900/30 dark:hover:text-red-400"
          >
            <LogOut size={21} aria-hidden />
          </button>
        </nav>
      </header>
    </>
  );
}