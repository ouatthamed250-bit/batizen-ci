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
    
    // Redirection intelligente
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex min-h-[70px] items-center justify-around bg-white/80 backdrop-blur-xl border-t border-white/30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe"
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
                "relative flex min-w-16 flex-col items-center gap-1 text-xs transition-all duration-300 active:scale-90",
                active ? "text-[var(--btp-orange)] font-semibold" : "text-gray-500 font-medium"
              )}
            >
              <span className={cn(
                "grid size-12 place-items-center rounded-full transition-all duration-300",
                active 
                  ? "text-white shadow-lg" 
                  : "text-[var(--btp-orange)]"
              )}
                style={{
                  background: active 
                    ? "linear-gradient(135deg, var(--btp-orange), var(--btp-orange-light))" 
                    : "rgba(255, 107, 0, 0.1)"
                }}
              >
                <Icon size={22} aria-hidden />
              </span>
              <span className="leading-none">{item.label}</span>
              {active && (
                <span className="absolute -bottom-1 flex h-1 w-4 justify-center">
                  <span className="block h-1 w-1 rounded-full bg-[var(--btp-orange)] shadow-[0_0_8px_var(--btp-orange)]" />
                </span>
              )}
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
              "relative flex min-w-16 flex-col items-center gap-1 text-xs transition-all duration-300 active:scale-90",
              active ? "text-[var(--btp-orange)] font-semibold" : "text-gray-500 font-medium"
            )}
          >
            <span className={cn(
              "grid size-12 place-items-center rounded-full transition-all duration-300",
              active && "shadow-lg"
            )}
              style={{
                background: active 
                  ? "linear-gradient(135deg, var(--btp-orange), var(--btp-orange-light))" 
                  : "rgba(255, 107, 0, 0.1)",
                color: active ? "white" : "var(--btp-orange)"
              }}
            >
              <Icon size={22} aria-hidden />
            </span>
            <span className="leading-none">{item.label}</span>
            {active && (
              <span className="absolute -bottom-1 flex h-1 w-4 justify-center">
                <span className="block h-1 w-1 rounded-full bg-[var(--btp-orange)] shadow-[0_0_8px_var(--btp-orange)]" />
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}