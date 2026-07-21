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
  // Header affiché UNIQUEMENT sur le dashboard
  const isDashboard = pathname === '/dashboard';
  
  return (
    <PremiumBackground>
      <main className="ios-scroll pt-4 pb-16 px-2 min-h-screen">
        {/* Header uniquement sur dashboard */}
        {isDashboard && <Header />}
        <div className="w-full">
          {children}
        </div>
      </main>
      <BottomNav />
    </PremiumBackground>
  );
}