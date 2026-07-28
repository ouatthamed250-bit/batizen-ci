"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Wallet, CalendarClock, Megaphone, Menu, X, Home, MessageCircle, Headphones, LogOut, UserRound, HardHat } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { WeatherWidget } from "@/components/btp/WeatherWidget";
import { getDatabase, ref as dbRef, onValue, update } from "firebase/database";
import { LazySection } from "@/components/LazySection";
import dynamic from "next/dynamic";
import AdminSecretModal from "@/components/auth/AdminSecretModal";
import AnnonceTicker from "@/components/ui/AnnonceTicker";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useChantiersQuery } from "@/hooks/useChantiersQuery";
import { useRenovationsQuery } from "@/hooks/useRenovationsQuery";
import { formatDateCourte, formatFcfa } from "@/utils/formatters";
import { DashboardHeader } from "./sections/DashboardHeader";
import { DashboardChantiersList } from "./sections/DashboardChantiersList";
const ChatBot = dynamic(() => import("@/components/ChatBot"), { ssr: false });

const ANNONCES_DEMO = ["🎉 Promo: -10% sur votre premier chantier ce mois-ci !","📢 Nouveau: Suivi de chantier par drone disponible.","🔥 Offre spéciale: Audit gratuit pour les rénovations.","⚠️ Rappel: Pensez à valider vos devis en attente."];

export default function DashboardClientPage() {
  const { user, logout } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [partenaires, setPartenaires] = useState<any[]>([]);
  const { data: chantiers, isLoading: chantiersLoading } = useChantiersQuery(user?.uid);
  const { data: renovations } = useRenovationsQuery(user?.uid);
  const chantiersList = chantiers ?? [];
  const renovationsActives = (renovations ?? []).filter(r => r.statut === "en_cours" || r.statut === "active");

  const handleLogoTap = useCallback(() => {
    const n = tapCount + 1; setTapCount(n);
    if (tapTimer) clearTimeout(tapTimer);
    const t = setTimeout(() => setTapCount(0), 2000);
    setTapTimer(t);
    if (n >= 5) { setTapCount(0); if (tapTimer) clearTimeout(tapTimer); setShowAdminModal(true); }
  }, [tapCount, tapTimer]);

  useEffect(() => { if (!user?.uid) { setLoading(false); return; } setIsAuthReady(true); setLoading(false); }, [user?.uid]);
  useEffect(() => { setLoading(chantiersLoading); }, [chantiersLoading]);
  useEffect(() => {
    const db = getDatabase();
    const unsub = onValue(dbRef(db, 'partenaires'), (s) => {
      const d = s.val();
      if (d) setPartenaires(Object.entries(d).filter(([_, p]: any) => p.actif === true).map(([id, p]: any) => ({ id, ...p })));
      else setPartenaires([]);
    });
    return () => unsub();
  }, []);

  const userName = user?.displayName || user?.email?.split("@")[0] || "Client";
  const chantiersActifs = chantiersList.filter(c => c.statut === "en_cours").length;
  const prochainRdv = chantiersList.filter(c => (c.statut === "en_attente" || c.statut === "en_attente_rdv") && c.rdv_date)
    .sort((a, b) => new Date(a.rdv_date!).getTime() - new Date(b.rdv_date!).getTime())[0];

  const handleSupprimerChantier = async (id: string, statut: string) => {
    if (statut === "en_cours" || statut === "termine" || statut === "terminé") { alert("⚠️ Impossible de supprimer un chantier en cours."); return; }
    if (!confirm("Voulez-vous vraiment supprimer ce chantier ?")) return;
    await update(dbRef(getDatabase(), `chantiers/${id}`), { statut: "supprime_par_client", dateMiseAJour: Date.now() });
    alert("✅ Chantier supprimé.");
  };
  const handleModifierChantier = (id: string) => { window.location.href = `/nouveau-chantier?edit=${id}`; };

  const menuItems = [
    { icon: Home, label: "Accueil", href: "/dashboard", active: true },
    { icon: HardHat, label: "Mes Projets", href: "/projets" },
    { icon: MessageCircle, label: "Messages", href: "/messages" },
    { icon: UserRound, label: "Mon Profil", href: "/profil" },
    { icon: Headphones, label: "Support", href: "/support" },
  ];

  return (
    <>
      <style>{`.wave-hand{display:inline-block;transform-origin:70% 70%;animation:wave 2.5s infinite}@keyframes wave{0%{transform:rotate(0deg)}10%{transform:rotate(14deg)}20%{transform:rotate(-8deg)}30%{transform:rotate(14deg)}40%{transform:rotate(-4deg)}50%{transform:rotate(10deg)}60%{transform:rotate(0deg)}100%{transform:rotate(0deg)}}.animate-marquee{animation:marquee 25s linear infinite}@keyframes marquee{0%{transform:translateX(0%)}100%{transform:translateX(-50%)}}@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
      <AdminSecretModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />
      
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0D2B6B] px-4 flex items-center justify-between shadow-md">
        <button type="button" onClick={() => setMenuOpen(true)} className="grid size-11 place-items-center rounded-full text-white transition hover:bg-white/15" aria-label="Menu"><Menu size={24} /></button>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 cursor-pointer" onClick={handleLogoTap}>
          <Image alt="Logo" src="/assets/images/logo.png" width={48} height={48} className="rounded-xl" />
          <span className="text-white font-black text-lg hidden sm:inline">BÂTIZEN CI</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <ThemeToggle />
          <Link href="/notifications" className="relative grid size-11 place-items-center rounded-full bg-white/15"><Bell size={21} /><span className="absolute right-2 top-2 size-2 rounded-full bg-[#FF7A00]" /></Link>
          <Link href="/profil" className="grid size-11 place-items-center rounded-full bg-white/15"><UserRound size={21} /></Link>
        </div>
      </div>

      {/* Drawer */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <aside className="fixed top-0 left-0 z-50 h-full w-[280px] bg-[#0D2B6B]/95 backdrop-blur-xl border-r border-white/10 shadow-2xl flex flex-col p-6" style={{ animation: "slideIn 0.3s ease-out" }}>
            <div className="flex items-center justify-between mb-8">
              <span className="text-white font-black text-lg">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="grid size-10 place-items-center rounded-full text-white/60 hover:text-white"><X size={20} /></button>
            </div>
            <nav className="flex-1 space-y-2">
              {menuItems.map(m => (
                <Link key={m.href} href={m.href} onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-bold transition ${m.active ? "bg-[#FF7A00] text-white shadow-md" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
                  <m.icon size={20} /> {m.label}
                </Link>
              ))}
            </nav>
            <button onClick={async () => { await logout(); window.location.href = "/login"; }} className="flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/10"><LogOut size={20} /> Déconnexion</button>
          </aside>
        </>
      )}

      <div className="flex flex-col gap-5 pt-20 pb-4">
        <DashboardHeader userName={userName} />

        {/* Marquee */}
        <div className="w-full overflow-hidden bg-[#FF7A00]/10 backdrop-blur-md rounded-[24px] border border-[#FF7A00]/30 py-3 shadow-lg">
          <div className="flex animate-marquee whitespace-nowrap gap-12 px-3">
            {[...ANNONCES_DEMO, ...ANNONCES_DEMO].map((a, i) => (<span key={i} className="text-sm font-bold text-[#FF7A00] drop-shadow-md flex items-center gap-2"><Megaphone size={14} />{a}</span>))}
          </div>
        </div>

        <AnnonceTicker />
        <div className="w-full rounded-[32px] p-6 md:p-8 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] text-white shadow-xl mb-2"><WeatherWidget title="Météo du jour" /></div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[{ label: "Simulation", icon: "🧮", href: "/simulation", color: "bg-[#FF7A00]" }, { label: "Nouveau Chantier", icon: "🏗️", href: "/nouveau-chantier", color: "bg-[#1e3a8a]" }, { label: "Rénovation", icon: "🔨", href: "/renovation", color: "bg-green-600" }].map((btn, i) => (
            <Link key={i} href={btn.href} className={`flex flex-col items-center justify-center p-3 ${btn.color} text-white rounded-[22px] shadow-lg transition active:scale-95`}>
              <span className="text-2xl mb-1 drop-shadow-md">{btn.icon}</span>
              <span className="text-[10px] font-bold text-center leading-tight">{btn.label}</span>
            </Link>
          ))}
        </div>

        <section className="w-full rounded-[28px] overflow-hidden shadow-xl"><LazySection loader={() => import("@/components/btp/SuperCalculateur")} /></section>

        {/* Summary cards */}
        {!loading && (
          <section className="grid grid-cols-2 gap-3 w-full">
            <div className="w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 flex flex-col items-center text-center gap-3 shadow-xl">
              <div className="grid size-14 place-items-center rounded-[20px] text-white bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B] shadow-lg"><HardHat size={26} /></div>
              <p className="text-[10px] font-bold text-white/80 uppercase">Chantiers actifs</p>
              <p className="text-base font-black text-white">{chantiersActifs}</p>
            </div>
            <div className="w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 flex flex-col items-center text-center gap-3 shadow-xl">
              <div className="grid size-14 place-items-center rounded-[20px] text-white bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B] shadow-lg"><Wallet size={26} /></div>
              <p className="text-[10px] font-bold text-white/80 uppercase">Dépensé ce mois</p>
              <p className="text-base font-black text-white">{formatFcfa(0)}</p>
            </div>
            <div className="w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 flex flex-col items-center text-center gap-3 shadow-xl">
              <div className="grid size-14 place-items-center rounded-[20px] text-white bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B] shadow-lg"><CalendarClock size={26} /></div>
              <p className="text-[10px] font-bold text-white/80 uppercase">Prochain RDV</p>
              <p className="text-base font-black text-white">{prochainRdv ? formatDateCourte(prochainRdv.rdv_date) : "Aucun"}</p>
            </div>
            <div className="w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 flex flex-col items-center text-center gap-3 shadow-xl">
              <div className="grid size-14 place-items-center rounded-[20px] text-white bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B] shadow-lg"><Bell size={26} /></div>
              <p className="text-[10px] font-bold text-white/80 uppercase">Notifications</p>
              <p className="text-base font-black text-white">0</p>
            </div>
          </section>
        )}

        {/* Chantiers list */}
        <DashboardChantiersList chantiers={chantiersList} isAuthReady={isAuthReady} loading={loading} onModifier={handleModifierChantier} onSupprimer={handleSupprimerChantier} />

        {/* Rénovations actives */}
        {renovationsActives.length > 0 && (
          <div className="w-full">
            <h3 className="font-black text-lg text-white mb-3">🔨 Rénovations en cours</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {renovationsActives.map(r => (
                <Link key={r.id} href={`/renovation-en-cours/${r.id}`} className="rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl">
                  <p className="font-black text-white text-lg">{r.lieu}</p>
                  <p className="text-sm text-white/80">{r.surface}m² · {formatFcfa(r.montantEstime)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Static sections */}
        <div className="mt-6 p-5 w-full bg-white/20 rounded-[28px] border border-white/30 backdrop-blur-xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-3">🏗️ À PROPOS DE BÂTIZEN.CI</h3>
          <p className="text-sm text-white/90">BÂTIZEN.CI est votre partenaire BTP de confiance en Côte d'Ivoire.</p>
        </div>

        <div className="mt-5 p-5 w-full bg-green-500/20 rounded-[28px] border border-green-400/30 backdrop-blur-xl shadow-xl">
          <h3 className="text-lg font-bold text-green-300 mb-3">🤝 NOS ENGAGEMENTS</h3>
          <ul className="text-sm text-white/80 space-y-2">
            <li>✅ Transparence totale des prix et des délais</li>
            <li>✅ Experts qualifiés et certifiés</li>
          </ul>
        </div>

        <div className="mt-6"><ChatBot /></div>

        {/* Partenaires */}
        <div className="mt-8 w-full">
          <h3 className="font-black text-xl text-white mb-4">🤝 Nos Partenaires de Confiance</h3>
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x scrollbar-hide w-full">
            {partenaires.map((p: any) => (
              <div key={p.id} className="min-w-[280px] bg-white/20 rounded-[24px] border border-white/30 backdrop-blur-xl shadow-lg p-4 flex flex-col items-center text-center snap-center">
                <h4 className="font-bold text-white text-lg mb-1">{p.nom}</h4>
                <p className="text-sm text-white/80 line-clamp-3">{p.description || "Partenaire certifié"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}