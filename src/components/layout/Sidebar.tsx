"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";

interface MenuItem {
  label: string;
  icon: string;
  href: string;
  useRouter?: boolean;
}

const menuItems: MenuItem[] = [
  { label: "Accueil", icon: "🏠", href: "/dashboard", useRouter: true },
  { label: "Simulation", icon: "📐", href: "/simulation" },
  { label: "Rénovation", icon: "🔨", href: "/renovation" },
  { label: "Nouveau chantier", icon: "➕", href: "/nouveau-chantier" },
  { label: "Matériaux", icon: "🧱", href: "/catalogue-materiaux" },
  { label: "Messages", icon: "💬", href: "/messages" },
  { label: "Devis", icon: "📋", href: "/devis" },
  { label: "Paiements", icon: "💰", href: "/historique" },
  { label: "Contact", icon: "📞", href: "/support" },
  { label: "Documents", icon: "📄", href: "/scanner" },
  { label: "Paramètres", icon: "⚙️", href: "/parametres" },
  { label: "Chantiers terminés", icon: "✅", href: "/historique" },
  { label: "Mes rapports", icon: "📊", href: "/rapports" },
];

export default function Sidebar() {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Fermer le menu au changement de route est géré dans handleNavigation

  // Bloquer le scroll quand le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Ne pas afficher le menu si l'utilisateur n'est pas connecté ou pendant le chargement
  if (loading) return null;
  if (!isAuthenticated) return null;

  const handleNavigation = (item: MenuItem) => {
    setIsOpen(false);
    if (item.useRouter) {
      router.push(item.href);
    }
  };

  return (
    <>
      {/* ========== BOUTON HAMBURGER ========== */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
        className="fixed top-5 left-5 z-[1000] grid size-12 place-items-center rounded-2xl bg-[#0D2B6B] shadow-[0_8px_24px_rgba(13,43,107,0.3)] transition-all duration-300 hover:scale-110 hover:bg-[#FF6B00] hover:shadow-[0_8px_24px_rgba(255,107,0,0.4)] active:scale-95"
      >
        <div className="relative flex size-7 flex-col items-center justify-center">
          {/* Ligne 1 */}
          <span
            className="absolute block h-[3px] w-7 rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              transform: isOpen
                ? "translateY(0) rotate(45deg)"
                : "translateY(-9px) rotate(0)",
            }}
          />
          {/* Ligne 2 */}
          <span
            className="absolute block h-[3px] w-7 rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              opacity: isOpen ? 0 : 1,
              transform: isOpen ? "scaleX(0)" : "scaleX(1)",
            }}
          />
          {/* Ligne 3 */}
          <span
            className="absolute block h-[3px] w-7 rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              transform: isOpen
                ? "translateY(0) rotate(-45deg)"
                : "translateY(9px) rotate(0)",
            }}
          />
        </div>
      </button>

      {/* ========== OVERLAY ========== */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[998] animate-[fadeIn_0.3s_ease] bg-black/70 backdrop-blur-[5px]"
        />
      )}

      {/* ========== SIDEBAR ========== */}
      <aside
        className="fixed left-0 top-0 z-[999] flex h-screen w-[320px] flex-col overflow-y-auto shadow-[10px_0_50px_rgba(0,0,0,0.5)] backdrop-blur-[10px] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* En-tête du menu */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] text-xl font-black text-white shadow-[0_4px_12px_rgba(255,107,0,0.3)]">
              B
            </div>
            <div>
              <h2 className="text-lg font-black text-white">BÂTIZEN</h2>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B00]">Menu principal</p>
            </div>
          </div>
          {/* Bouton fermeture X */}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Fermer"
            className="grid size-10 place-items-center rounded-xl text-white transition-all duration-300 hover:rotate-90 hover:text-[#FF6B00]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Séparateur */}
        <div className="mx-6 mb-2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-4">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            
            if (item.useRouter) {
              return (
                <button
                  key={item.href + item.label}
                  onClick={() => handleNavigation(item)}
                  className="group relative flex w-full items-center gap-4 rounded-xl px-4 py-5 transition-all duration-300 hover:translate-x-[6px] hover:scale-[1.02] hover:bg-gradient-to-r hover:from-[#FF6B00] hover:to-[#FF8C00] hover:shadow-[5px_5px_15px_rgba(255,107,0,0.3)]"
                  style={{
                    animation: isOpen
                      ? `sidebarItemFadeIn 0.4s ease ${0.05 * (index + 1)}s both`
                      : "none",
                    background: isActive
                      ? "linear-gradient(135deg, rgba(255,107,0,0.25), rgba(255,140,0,0.15))"
                      : "transparent",
                    borderLeft: isActive ? "3px solid #FF6B00" : "3px solid transparent",
                  }}
                >
                  <span
                    className="size-6 text-center text-xl transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                    style={{ 
                      filter: isActive ? "drop-shadow(0 0 6px rgba(255,107,0,0.8))" : "none",
                      color: isActive ? "#FF6B00" : "#F5F5F5"
                    }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-base font-bold dark:text-[#F5F5F5] text-gray-900 group-hover:text-white">{item.label}</span>
                  <span className="ml-auto text-sm text-white/0 transition-all duration-300 group-hover:text-white/80">→</span>
                </button>
              );
            }
            
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={() => handleNavigation(item)}
                className="group relative flex items-center gap-4 rounded-xl px-4 py-5 transition-all duration-300 hover:translate-x-[6px] hover:scale-[1.02] hover:bg-gradient-to-r hover:from-[#FF6B00] hover:to-[#FF8C00] hover:shadow-[5px_5px_15px_rgba(255,107,0,0.3)]"
                style={{
                  animation: isOpen
                    ? `sidebarItemFadeIn 0.4s ease ${0.05 * (index + 1)}s both`
                    : "none",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(255,107,0,0.25), rgba(255,140,0,0.15))"
                    : "transparent",
                  borderLeft: isActive ? "3px solid #FF6B00" : "3px solid transparent",
                }}
              >
                <span
                  className="size-6 text-center text-xl transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                  style={{ 
                    filter: isActive ? "drop-shadow(0 0 6px rgba(255,107,0,0.8))" : "none",
                    color: isActive ? "#FF6B00" : "#F5F5F5"
                  }}
                >
                  {item.icon}
                </span>
                <span className="text-base font-bold dark:text-[#F5F5F5] text-gray-900 group-hover:text-white">{item.label}</span>
                <span className="ml-auto text-sm text-white/0 transition-all duration-300 group-hover:text-white/80">→</span>
              </Link>
            );
          })}
        </nav>

        {/* Pied du menu */}
        <div className="mx-6 mb-2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Bouton WhatsApp */}
        <a
          href="https://wa.me/2250554233234"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-4 mb-3 flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 hover:bg-[#25D366]/20 hover:pl-5"
        >
          <span className="text-2xl">📱</span>
          <span className="text-base font-bold text-[#25D366]">Contact WhatsApp</span>
        </a>
        
        <div className="px-6 py-4">
          <p className="text-xs text-white/40">BÂTIZEN CI v1.0</p>
        </div>
      </aside>

      {/* Styles CSS pour les animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sidebarItemFadeIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}