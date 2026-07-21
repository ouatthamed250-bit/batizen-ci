"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, User } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import NotificationBell from "@/components/ui/NotificationBell";

// Fonction helper pour les titres dynamiques
const getPageTitle = (pathname: string | null): string => {
  if (!pathname) return "BÂTIZEN.CI";
  
  const titles: Record<string, string> = {
    "/projets": "Mes Projets",
    "/profil": "Mon Profil",
    "/messages": "Messages",
    "/simulation": "Simulation",
    "/nouveau-chantier": "Nouveau Chantier",
    "/renovation": "Rénovation",
    "/historique": "Historique",
    "/devis": "Mes Devis",
  };

  // Gestion dynamique des routes chantier
  if (pathname.includes("/chantier/")) return "Détail Chantier";
  if (pathname.includes("/admin")) return "Administration";
  if (pathname.includes("/assistant-chat")) return "Assistant IA";

  return titles[pathname] || "BÂTIZEN.CI";
};

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const isDashboard = pathname === "/dashboard" || pathname === "/dashboard/";

  // Ferme le menu quand on navigue
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "?";

  return (
    <>
      {/* HEADER DASHBOARD - Glassmorphism premium */}
      {isDashboard && (
        <header className="gpu-accelerated fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between bg-white/80 dark:bg-[#081423]/80 backdrop-blur-xl px-4 border-b border-white/30 dark:border-[#1D3557]/50">
          {/* Gauche : Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B] rounded-xl flex items-center justify-center text-white text-xl shadow-lg transition-all active:scale-95"
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>

          {/* Centre : Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl">🏗️</span>
            <h1 className="font-black text-lg bg-gradient-to-r from-[#0B5FFF] to-[#0D2B6B] bg-clip-text text-transparent">BÂTIZEN.CI</h1>
          </div>

          {/* Droite : Notifications + Avatar */}
          <div className="flex items-center gap-2">
            {isAuthenticated && <NotificationBell />}
            
            {isAuthenticated && user ? (
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF7A00] to-[#D97706] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {initials}
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 transition-all active:scale-95"
                aria-label="Se connecter"
              >
                <User size={18} />
              </button>
            )}
          </div>
        </header>
      )}

      {/* HEADER AUTRES PAGES - Bleu simplifié #0D2B6B avec arrondi */}
      {!isDashboard && (
        <header className="gpu-accelerated fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between bg-[#0D2B6B] rounded-b-3xl px-4">
          {/* Gauche : Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl backdrop-blur-sm transition-all active:scale-95"
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>

          {/* Centre : Titre */}
          <h1 className="font-black text-white text-lg">
            {getPageTitle(pathname)}
          </h1>

          {/* Droite : Espace vide pour alignement */}
          <div className="w-10"></div>
        </header>
      )}

      {/* Menu latéral */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)}>
          <nav
            className="absolute left-0 top-0 h-full w-4/5 max-w-sm bg-white dark:bg-gray-800 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du menu */}
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xl font-black text-gray-800 dark:text-white">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="grid size-9 place-items-center rounded-full bg-gray-100 dark:bg-gray-700 transition-all active:scale-95"
                aria-label="Fermer le menu"
              >
                <X size={18} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Items du menu */}
            <div className="space-y-2">
              {[
                { href: "/dashboard", label: "Tableau de bord", icon: "📊" },
                { href: "/renovation", label: "Rénovation", icon: "🔨" },
                { href: "/catalogue-materiaux", label: "Matériaux", icon: "🧱" },
                { href: "/messages", label: "Messages", icon: "💬" },
                { href: "/devis", label: "Devis", icon: "📋" },
              ].map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}