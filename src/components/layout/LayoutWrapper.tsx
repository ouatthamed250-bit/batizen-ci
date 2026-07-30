"use client";

import { usePathname } from "next/navigation";
import { PremiumHeader } from "./PremiumHeader";
import { BottomNav } from "./BottomNav";
import PremiumBackground from "./PremiumBackground";
import AnnonceTicker from "@/components/ui/AnnonceTicker";

interface LayoutWrapperProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBottomNav?: boolean;
}

export default function LayoutWrapper({ children, showHeader: showHeaderProp = true, showBottomNav = true }: LayoutWrapperProps) {
  const pathname = usePathname();

  // 1. Pages publiques ou admin : AUCUN layout (ni header, ni bottom nav)
  const isPublicOrAdmin = 
    pathname === "/" || 
    pathname === "/login" || 
    pathname === "/register" || 
    pathname === "/forgot-password" ||
    pathname?.startsWith("/admin");

  if (isPublicOrAdmin) {
    return <>{children}</>;
  }

  // Le PremiumHeader est maintenant affiché PARTOUT sur les pages connectées
  // (y compris dashboard et profil) pour uniformiser l'expérience.
  const showHeader = showHeaderProp;

  return (
    <PremiumBackground>
      <main className="ios-scroll pt-4 pb-24 px-2 min-h-screen">
        {/* Header uniforme sur toutes les pages connectées */}
        <PremiumHeader />
        
        <div className="w-full">
          {children}
        </div>
      </main>
      
      {/* La barre de navigation du bas reste toujours visible */}
      {showBottomNav && <BottomNav />}
    </PremiumBackground>
  );
}
