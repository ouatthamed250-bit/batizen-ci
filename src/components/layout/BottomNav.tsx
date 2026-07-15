"use client";

import Link from "next/link";
import { Home as HomeIcon, Plus, FolderKanban, Calculator, MessageCircle, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/helpers";
import { useAuthContext } from "@/contexts/AuthContext";

const NAV_HEIGHT = 70;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();

  // Pages où la BottomNav doit être masquée
  const hideNavPaths = ["/", "/login", "/register", "/forgot-password"];
  if (hideNavPaths.includes(pathname)) {
    return null;
  }

  const navItems = [
    { label: "Accueil", href: "/", icon: HomeIcon, isHome: true },
    { label: "Projets", href: "/projets", icon: FolderKanban },
    { label: "Messages", href: "/messages", icon: MessageCircle },
    { label: "Profil", href: "/profil", icon: UserRound },
  ];

  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === "/" || pathname === "/dashboard") return;
    
    // Animation de clic
    const target = e.currentTarget as HTMLElement;
    target.style.transform = "scale(1.2)";
    setTimeout(() => {
      target.style.transform = "scale(1)";
    }, 150);

    // Redirection intelligente
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-[70px] items-center justify-around bg-white/95 backdrop-blur-xl border-t border-white/60 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      style={{ 
        paddingBottom: "env(safe-area-inset-bottom)",
        height: `${NAV_HEIGHT}px`,
      }}
      aria-label="Navigation principale"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href === "/" && pathname === "/dashboard");

        if (item.isHome) {
          return (
            <button
              key="home"
              onClick={handleHomeClick}
              aria-label="Accueil"
              className={cn(
                "relative flex min-w-16 flex-col items-center gap-1 text-xs font-semibold transition-all active:scale-95",
                active ? "text-[#FF6B00]" : "text-[#6B7280] hover:text-[#111827]"
              )}
            >
<span className={cn(
               "grid size-12 place-items-center rounded-full transition-all",
               active 
                 ? "bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] text-white shadow-lg" 
                 : "bg-white/50 text-[#FF6B00]"
             )}>
               <Icon size={22} aria-hidden />
              </span>
              <span className="leading-none">Accueil</span>
              {active && <span className="absolute -bottom-1 size-1 rounded-full bg-[#FF6B00]" />}
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-w-16 flex-col items-center gap-1 text-xs font-semibold transition-all active:scale-95",
              active ? "text-[#0B5FFF]" : "text-[#6B7280] hover:text-[#111827]"
            )}
          >
<span className={cn(
              "grid size-12 place-items-center rounded-full transition-all",
              active && "bg-[#EAF2FF]"
            )}>
              <Icon size={22} aria-hidden />
            </span>
            <span className="leading-none">{item.label}</span>
            {active && <span className="absolute -bottom-1 size-1 rounded-full bg-[#0B5FFF]" />}
          </Link>
        );
      })}
    </nav>
  );
}