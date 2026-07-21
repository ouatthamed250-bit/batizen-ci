"use client";

import { Bell, ChevronRight, FileText, HelpCircle, Lock, LogOut, Settings, ShieldCheck, UserRound, Star, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { Badge } from "@/components/ui/Badge";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/helpers";

const menuItems = [
  { icon: Settings,   label: "Paramètres du compte",  href: "/parametres",      desc: "Modifier vos informations personnelles, langue et notifications" },
  { icon: Bell,       label: "Alertes & Rappels",      href: "/notifications",   desc: "Gérer vos notifications chantier, devis et messages" },
  { icon: Lock,       label: "Confidentialité",        href: "/confidentialite", desc: "Contrôler vos données, accès et sécurité du compte" },
  { icon: FileText,   label: "Conditions d'utilisation",href: "/conditions",     desc: "Lire les CGU, mentions légales et politique BÂTIZEN CI" },
  { icon: HelpCircle, label: "Aide & Support",         href: "/support",         desc: "Contacter l'équipe, FAQ et assistance technique" },
];

export default function ProfilePage() {
  const { user, logout } = useAuthContext();
  const router = useRouter();

  const initials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <main className="pt-20 pb-16 px-4 min-h-screen bg-[#f9fafb]" style={{
      background: "var(--bg-profil)"
    }}>
      <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6">
        <PremiumHeader />

        <div className="space-y-5">

          {/* ── Hero identité ── */}
          <div className="relative overflow-hidden rounded-[32px] p-6"
            style={{ background: "linear-gradient(145deg, var(--navy) 0%, #0B3A8A 40%, #1A1040 100%)" }}>
            {/* Orbes déco */}
            <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full opacity-[0.12] blur-[50px]" style={{ background: "var(--orange)" }} />
            <div className="pointer-events-none absolute -bottom-8 -left-8 size-40 rounded-full opacity-[0.15] blur-[40px]" style={{ background: "var(--primary)" }} />
            {/* Reflet haut */}
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="relative flex items-center gap-5">
              {/* Avatar */}
              <div className="relative size-20 shrink-0">
                <div className="absolute inset-0 rounded-[24px] opacity-80 blur-[8px]" style={{ background: "linear-gradient(135deg,var(--orange),#FF9500)" }} />
                <div className="relative size-20 overflow-hidden rounded-[24px] border-2 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                  {user?.photoURL ? (
                    <Image src={user.photoURL} alt={user.displayName ?? "Profil"} fill className="object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-2xl font-black text-white" style={{ background: "linear-gradient(135deg,var(--primary),var(--navy))" }}>
                      {initials}
                    </div>
                  )}
                </div>
                {/* Badge premium */}
                <div className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full shadow-[0_2px_8px_rgba(255,122,0,0.6)]" style={{ background: "var(--orange)" }}>
                  <Star size={12} className="text-white" fill="white" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-black tracking-tight text-white">
                  {user?.displayName ?? user?.email ?? "Mon profil"}
                </h1>
                <p className="mt-0.5 text-sm font-semibold text-white/60">Client Premium · BÂTIZEN CI</p>
                <div className="mt-2 flex items-center gap-2">
                  <ThemeToggle />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-[#22C55E]/20 px-2.5 py-1 text-[10px] font-black text-[#4ADE80]">
                    <ShieldCheck size={10} /> Compte vérifié
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-[#FF7A00]/20 px-2.5 py-1 text-[10px] font-black text-[#FFB347]">
                    <Zap size={10} /> Premium actif
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="relative mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
              {[
                { label: "Projets actifs",  value: "2", color: "#4D8FFF" },
                { label: "Devis générés",   value: "2", color: "#FF9A30" },
                { label: "Messages reçus",  value: "3", color: "#4ADE80" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-white/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Slogan ── */}
          <div className="rounded-[20px] border px-5 py-4" style={{
            borderColor: "rgba(255,122,0,0.2)",
            background: "linear-gradient(135deg,rgba(255,122,0,0.06),rgba(11,95,255,0.04))"
          }}>
            <p className="text-center text-sm font-black" style={{ color: "var(--navy)" }}>
              🏗️ <span className="text-gradient-orange">Bâtissez votre maison</span>{" "}
              <span style={{ color: "var(--navy)" }}>sans stress —</span>{" "}
              <span className="text-gradient-blue">du sol au toit.</span>
            </p>
          </div>

          {/* ── Sécurité & préférences ── */}
          <div className="overflow-hidden rounded-[24px] border bg-white/90 shadow-[0_6px_24px_rgba(13,43,107,0.08)]" style={{
            borderColor: "var(--stroke)",
            background: "var(--surface)"
          }}>
            <div className="flex items-center gap-3 border-b px-5 py-4" style={{
              borderColor: "var(--stroke)",
              background: "var(--surface)"
            }}>
              <div className="grid size-10 place-items-center rounded-[14px] text-white shadow-[0_4px_12px_rgba(11,95,255,0.3)]" style={{
                background: "linear-gradient(135deg,var(--primary),var(--navy))"
              }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="font-black" style={{ color: "var(--navy)" }}>Sécurité & préférences</h2>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Gérez votre compte, vos accès et vos données personnelles</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 p-4">
              <PremiumButton href="/parametres" className="flex-1 !h-[48px] !text-sm">Paramètres</PremiumButton>
              <PremiumButton href="/confidentialite" variant="outline" className="flex-1 !h-[48px] !text-sm">Confidentialité</PremiumButton>
            </div>
          </div>

          {/* ── Menu items ── */}
          <div className="space-y-2">
            {menuItems.map((item, i) => (
              <a key={item.href} href={item.href} aria-label={item.label}
                className={cn(
                  "flex items-center gap-4 rounded-[20px] border p-4 transition-all",
                  "animate-fadeInUp",
                )}
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--stroke)",
                  boxShadow: "0 2px 12px rgba(13,43,107,0.05)",
                  animationDelay: `${i * 0.05}s`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(11,95,255,0.25)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(11,95,255,0.10)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--stroke)";
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(13,43,107,0.05)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-[14px] shadow-[0_3px_8px_rgba(13,43,107,0.12)]"
                  style={{ background: "linear-gradient(145deg, #EEF3FF, #E4ECFF)" }}>
                  <item.icon size={20} style={{ color: "var(--primary)" }} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black" style={{ color: "var(--text)" }}>{item.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{item.desc}</p>
                </div>
                <ChevronRight size={18} className="shrink-0" style={{ color: "var(--muted)" }} aria-hidden />
              </a>
            ))}
          </div>

          {/* ── Déconnexion ── */}
          <button type="button" onClick={handleLogout} aria-label="Se déconnecter"
            className="animate-fadeInUp stagger-5 flex w-full items-center justify-center gap-2.5 rounded-[20px] border-2 py-4 text-sm font-black shadow-[0_2px_12px_rgba(239,68,68,0.08)] transition-all active:scale-[0.98]"
            style={{
              borderColor: "rgba(239,68,68,0.15)",
              background: "rgba(239,68,68,0.05)",
              color: "var(--error)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(239,68,68,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.05)";
              e.currentTarget.style.boxShadow = "0 2px 12px rgba(239,68,68,0.08)";
            }}
          >
            <LogOut size={18} aria-hidden />
            Se déconnecter
          </button>

          {/* ── Footer slogan ── */}
          <p className="pb-2 text-center text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: "var(--muted)" }}>
            BÂTIZEN CI · Qualité · Innovation · Confiance
          </p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
