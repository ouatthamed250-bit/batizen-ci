"use client";

import { Bell, ChevronRight, FileText, HelpCircle, Lock, LogOut, Settings, ShieldCheck, UserRound, Star, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
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
    <>
      <main className="ios-scroll pt-4 pb-16 px-4 min-h-screen">
          <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6">

            <div className="space-y-5">
              {/* ── Hero identité ── */}
              <div className="relative overflow-hidden rounded-[32px] p-6 bg-gradient-to-br from-[#0D2B6B] to-[#1A1040]">
                {/* Orbes déco */}
                <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full opacity-[0.12] blur-[50px] bg-[#FF7A00]" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 size-40 rounded-full opacity-[0.15] blur-[40px] bg-[#0B5FFF]" />
                {/* Reflet haut */}
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <div className="relative flex items-center gap-5">
                  {/* Avatar */}
                  <div className="relative size-20 shrink-0">
                    <div className="absolute inset-0 rounded-[24px] opacity-80 blur-[8px] bg-gradient-to-br from-[#FF7A00] to-[#FFB347]" />
                    <div className="relative size-20 overflow-hidden rounded-[24px] border-2 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                      {user?.photoURL ? (
                        <Image src={user.photoURL} alt={user.displayName ?? "Profil"} fill className="object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-2xl font-black text-white bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B]">
                          {initials}
                        </div>
                      )}
                    </div>
                    {/* Badge premium */}
                    <div className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full shadow-[0_2px_8px_rgba(255,122,0,0.6)] bg-[#FF7A00]">
                      <Star size={12} className="text-white" fill="white" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-black tracking-tight text-white drop-shadow-md">
                      {user?.displayName ?? user?.email ?? "Mon profil"}
                    </h1>
                    <p className="mt-0.5 text-sm font-semibold text-white/60 drop-shadow-md">Client Premium · BÂTIZEN CI</p>
                    <div className="mt-2 flex items-center gap-2">
                      <ThemeToggle />
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-[10px] font-black text-green-300">
                        <ShieldCheck size={10} /> Compte vérifié
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-[#FF7A00]/20 px-2.5 py-1 text-[10px] font-black text-orange-300">
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
                      <p className="text-2xl font-black drop-shadow-md" style={{ color: s.color }}>{s.value}</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-white/50 drop-shadow-md">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Slogan ── */}
              <div className="rounded-[20px] border px-5 py-4" style={{
                borderColor: "rgba(255,122,0,0.2)",
                background: "linear-gradient(135deg,rgba(255,122,0,0.06),rgba(11,95,255,0.04))"
              }}>
                <p className="text-center text-sm font-black text-white drop-shadow-md">
                  🏗️ <span className="text-gradient-orange">Bâtissez votre maison</span>{" "}
                  <span className="text-white">sans stress —</span>{" "}
                  <span className="text-gradient-blue">du sol au toit.</span>
                </p>
              </div>

              {/* ── Sécurité & préférences ── */}
              <div className="overflow-hidden rounded-[24px] border bg-white/20 backdrop-blur-xl shadow-lg border-white/30">
                <div className="flex items-center gap-3 border-b px-5 py-4 border-b border-white/20">
                  <div className="grid size-10 place-items-center rounded-[14px] text-white shadow-[0_4px_12px_rgba(11,95,255,0.3)] bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B]">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="font-black text-white drop-shadow-md">Sécurité & préférences</h2>
                    <p className="text-xs text-white/70 drop-shadow-md">Gérez votre compte, vos accès et vos données personnelles</p>
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
                      "flex items-center gap-4 rounded-[20px] border p-4 transition-all bg-white/20 backdrop-blur-xl border-white/30 shadow-lg",
                      "hover:bg-white/30 hover:border-white/50",
                    )}
                    style={{
                      animationDelay: `${i * 0.05}s`
                    }}
                  >
                    <div className="grid size-11 shrink-0 place-items-center rounded-[14px] shadow-[0_3px_8px_rgba(13,43,107,0.12)] bg-white/30">
                      <item.icon size={20} className="text-[#0B5FFF]" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-white drop-shadow-md">{item.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/70 drop-shadow-md">{item.desc}</p>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-white/60" aria-hidden />
                  </a>
                ))}
              </div>

              {/* ── Déconnexion ── */}
              <button type="button" onClick={handleLogout} aria-label="Se déconnecter"
                className="flex w-full items-center justify-center gap-2.5 rounded-[20px] border-2 py-4 text-sm font-black transition-all active:scale-[0.98] bg-red-500/20 border-red-400/30 text-red-300 shadow-lg"
              >
                <LogOut size={18} aria-hidden />
                Se déconnecter
              </button>

              {/* ── Footer slogan ── */}
              <p className="pb-2 text-center text-[10px] font-bold tracking-[0.15em] uppercase text-white/60 drop-shadow-md">
                BÂTIZEN CI · Qualité · Innovation · Confiance
              </p>
            </div>
          </div>

        </main>
        <BottomNav />
    </>
  );
}