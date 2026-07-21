"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import Sidebar from "./Sidebar";
import { BottomNav } from "./BottomNav";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ⚠️ Routes où on n'affiche AUCUN menu client
  const isPublicRoute = 
    pathname === "/" || 
    pathname === "/login" || 
    pathname === "/register" || 
    pathname === "/forgot-password";
  
  const isAdminRoute = pathname?.startsWith("/admin");

  // Si page publique OU admin → juste le contenu, sans aucun menu
  if (isPublicRoute || isAdminRoute) {
    return <>{children}</>;
  }

// Pour toutes les autres pages (connectées) → interface complète
  // Header gère déjà le hamburger + menu latéral intégré
  return (
    <>
      <Header />
      <main className="flex-1 pt-20 pb-16 px-4 min-h-screen bg-[#f9fafb]">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
