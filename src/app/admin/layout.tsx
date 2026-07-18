"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  HardHat,
  Hammer,
  CalendarDays,
  BrickWall,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Handshake,
} from "lucide-react";
import { logoutAdmin } from "@/lib/admin";
import { useAuthContext } from "@/contexts/AuthContext";

const SIDEBAR = [
  { key: "clients", label: "Clients", icon: Users, href: "/admin/clients" },
  { key: "chantiers", label: "Chantiers", icon: HardHat, href: "/admin?section=chantiers" },
  { key: "ouvriers", label: "Ouvriers", icon: Hammer, href: "/admin?section=ouvriers" },
  { key: "rendez-vous", label: "Rendez-vous", icon: CalendarDays, href: "/admin?section=rendez-vous" },
  { key: "materiaux", label: "Matériaux", icon: BrickWall, href: "/admin?section=materiaux" },
  { key: "promotions", label: "Promotions", icon: Megaphone, href: "/admin?section=promotions" },
  { key: "partenaires", label: "Partenaires", icon: Handshake, href: "/admin?section=partenaires" },
  { key: "statistiques", label: "Statistiques", icon: BarChart3, href: "/admin?section=statistiques" },
  { key: "parametres", label: "Paramètres", icon: Settings, href: "/admin?section=parametres" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [open, setOpen] = useState(false);

  // ⚠️ Vérification stricte : seul un admin peut accéder à /admin
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "admin") {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827] text-white">
        <div className="text-center">
          <div className="mb-4 text-2xl font-black">BÂTIZEN Admin</div>
          <div className="text-sm text-white/70">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-[#0B111E] p-4 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="grid size-9 place-items-center rounded-[12px] bg-[#FF7A00] font-black">B</div>
          <span className="text-lg font-black tracking-tight">BÂTIZEN Admin</span>
        </div>
<nav className="flex-1 space-y-1">
          {SIDEBAR.map((s) => {
            const active = pathname.includes(s.key);
            return (
              <Link
                key={s.key}
                href={s.href || `/admin?section=${s.key}`}
                className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-bold transition ${
                  active ? "bg-[#FF7A00] text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <s.icon size={18} />
                {s.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={logoutAdmin}
          className="mt-4 flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/10"
        >
          <LogOut size={18} /> Déconnexion
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0B111E] px-4 py-3 lg:hidden">
        <span className="font-black">BÂTIZEN Admin</span>
        <button type="button" onClick={() => setOpen(true)} aria-label="Menu">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-[#0B111E] p-4">
            <div className="mb-6 flex items-center justify-between px-2">
              <span className="text-lg font-black">Admin</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer">
                <X size={22} />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {SIDEBAR.map((s) => (
                <Link
                  key={s.key}
                  href={`/admin?section=${s.key}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <s.icon size={18} />
                  {s.label}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              onClick={logoutAdmin}
              className="mt-4 flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-bold text-red-400"
            >
              <LogOut size={18} /> Déconnexion
            </button>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">{children}</div>
    </div>
  );
}