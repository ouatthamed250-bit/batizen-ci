"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, User, Construction } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import NotificationBell from "@/components/ui/NotificationBell";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ferme le menu quand on navigue
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "?";

  return (
    <>
      {/* Header fixe */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-[60px] items-center justify-between bg-white/95 px-4 shadow-md backdrop-blur-sm">
        {/* Gauche : Hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
          className="grid size-10 place-items-center rounded-full bg-white/50 transition-all active:scale-95"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} className="text-[#FF6B00]" />
        </button>

        {/* Centre : Logo */}
        <Link href={isAuthenticated ? "/dashboard" : "/login"} className="flex items-center gap-2">
          <Construction size={22} className="text-[#FF6B00]" />
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] bg-clip-text text-transparent">
            BÂTIZEN.CI
          </span>
        </Link>

        {/* Droite : Notifications + Avatar */}
        <div className="flex items-center gap-2">
          {isAuthenticated && <NotificationBell />}
          
          {isAuthenticated && user ? (
            <Link
              href="/profil"
              className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] font-bold text-white shadow-md transition-all active:scale-95"
            >
              {initials}
            </Link>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="grid size-10 place-items-center rounded-full bg-white/50 transition-all active:scale-95"
              aria-label="Se connecter"
            >
              <User size={18} className="text-[#FF6B00]" />
            </button>
          )}
        </div>
      </header>

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