"use client";

import { usePathname } from "next/navigation";
import { PremiumHeader } from "./PremiumHeader";
import { BottomNav } from "./BottomNav";
import PremiumBackground from "./PremiumBackground";

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

  // 2. Règle stricte : Cacher le header UNIQUEMENT sur Dashboard et Profil
  const isDashboard = pathname === "/dashboard";
  const isProfile = pathname === "/profil" || pathname?.startsWith("/profil");
  
  // On affiche le header PARTOUT, sauf si c'est le dashboard ou le profil,
  // sauf si la page appelante a explicitement désactivé le header via la prop showHeader.
  const showHeader = showHeaderProp && !isDashboard && !isProfile;

  return (
    <PremiumBackground>
      <main className="ios-scroll pt-4 pb-24 px-2 min-h-screen">
        {/* Le header s'affiche sur Nouveau Chantier, Simulation, Messages, Chantier en cours, etc. */}
        {showHeader && <PremiumHeader />}
        
        <div className="w-full">
          {children}
        </div>
      </main>
      
      {/* La barre de navigation du bas reste toujours visible */}
      {showBottomNav && <BottomNav />}
    </PremiumBackground>
  );
}
