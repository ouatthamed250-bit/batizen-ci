"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { Bell, UserRound, LogOut } from "lucide-react";
import { imagePaths } from "@/lib/helpers";
import { useAuthContext } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
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

      <header className="fixed top-0 left-0 right-0 z-50 w-full flex h-16 items-center justify-between bg-[#0D2B6B] px-4 shadow-md">
        
        {/* LOGO — 5 taps rapides pour ouvrir le modal admin secret */}
        <Link className="flex items-center gap-3" href="/dashboard" aria-label="Accueil BÂTIZEN CI">
          <Image
            alt="Logo BÂTIZEN CI"
            className="rounded-2xl cursor-pointer"
            height={48}
            priority
            src={imagePaths.logo}
            width={48}
            onClick={handleLogoTap}
          />
          <span className="hidden text-base font-black tracking-tight text-white sm:inline">BÂTIZEN CI</span>
        </Link>

        {/* BOUTONS D'ACTION */}
        <nav className="flex items-center gap-2" aria-label="Actions rapides">
          {user?.displayName && (
            <span className="hidden text-sm font-bold text-white md:inline">
              {user.displayName.split(" ")[0]} 👋
            </span>
          )}

          <ThemeToggle />

          <Link
            className="relative grid size-11 place-items-center rounded-full bg-white/15 text-white transition hover:bg-[#3B7FFF]/30 active:scale-95"
            href="/notifications"
            aria-label="Notifications"
          >
            <Bell size={21} aria-hidden />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-[#FF7A00] shadow-sm" aria-hidden />
          </Link>

          <Link
            className="grid size-11 place-items-center overflow-hidden rounded-full bg-[#3B7FFF] text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition hover:bg-[#4B8FFF] active:scale-95"
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
            className="grid size-11 place-items-center rounded-full bg-white/15 text-white/80 transition hover:bg-red-500/30 hover:text-red-300 active:scale-95"
          >
            <LogOut size={21} aria-hidden />
          </button>
        </nav>
      </header>
    </>
  );
}