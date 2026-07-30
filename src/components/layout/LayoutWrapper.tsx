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

  // Cacher le header UNIQUEMENT sur Dashboard et Profil (ils ont leur propre header inline)
  const isDashboard = pathname === "/dashboard";
  const isProfile = pathname === "/profil" || pathname?.startsWith("/profil");
  const showHeader = showHeaderProp && !isDashboard && !isProfile;

  return (
    <PremiumBackground>
      <main className="ios-scroll pt-16 pb-24 px-2 min-h-screen">
        {showHeader && <PremiumHeader />}
        
        <div className="w-full text-gray-900 dark:text-white">
          {children}
        </div>
      </main>
      
      {/* La barre de navigation du bas reste toujours visible */}
      {showBottomNav && <BottomNav />}
    </PremiumBackground>
  );
}
