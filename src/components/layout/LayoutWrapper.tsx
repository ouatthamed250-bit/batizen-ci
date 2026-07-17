"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import Sidebar from "./Sidebar";
import { BottomNav } from "./BottomNav";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ⚠️ RÈGLE ABSOLUE : Si on est dans l'admin, on ne rend QUE le contenu. 
  // Pas de Header, pas de Sidebar, pas de BottomNav.
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  // Pour toutes les autres pages, on affiche l'interface client complète
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <Sidebar />
      <main className="flex-1 pb-24"> {/* pb-24 est crucial pour ne pas cacher le contenu derrière la BottomNav */}
        {children}
      </main>
      <BottomNav />
    </div>
  );
}