"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import PremiumBackground from "./PremiumBackground";

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
      <PremiumBackground>
      <main className="ios-scroll flex-1 pt-4 pb-16 px-2 min-h-screen">
          <div className="w-full">
            {children}
          </div>
        </main>
      </PremiumBackground>
      <BottomNav />
    </>
  );
}