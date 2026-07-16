"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import {
  HardHat,
  Wallet,
  CalendarClock,
  Bell,
  BrickWall,
  CalendarPlus,
  Hammer,
  Receipt,
  FileText,
  Bot,
  ChevronRight,
  Calculator,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { WeatherWidget } from "@/components/btp/WeatherWidget";
import { ProgressBar } from "@/components/ui/ProgressBar";
import SuperCalculateur from "@/components/btp/SuperCalculateur";
import { rtdbGetList, rtdbGetListByChild } from "@/lib/rtdb";
import { formatFcfa } from "@/utils/currency";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type Chantier = {
  id: string;
  client_id?: string;
  userId?: string;
  nom?: string;
  nom_projet?: string;
  photo?: string;
  image_url?: string;
  statut?: string;
  status?: string;
  progression?: number;
  progress?: number;
  date_fin?: string;
  date_debut?: string;
  type?: string;
  localisation?: string;
  plan_choisi?: string;
  rdv_date?: string;
  budget?: number;
  date_soumission?: string;
};

type Paiement = {
  id: string;
  montant?: number;
  date?: string;
  mois?: string;
};

type RendezVous = {
  id: string;
  date?: string;
  type?: string;
  lieu?: string;
};

type NotificationItem = {
  id: string;
  lu?: boolean;
  message?: string;
};

type Partenaire = {
  id: string;
  nom?: string;
  logo?: string;
  description?: string;
  statut?: "actif" | "bientot_disponible";
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const JOURS = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
];

function formatDateFrancais(d: Date): string {
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateFr(d?: string): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${dt.getDate()} ${MOIS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function statutLabel(s?: string): string {
  switch (s) {
    case "en_cours":
    case "en cours":
      return "En cours";
    case "termine":
    case "terminé":
      return "Terminé";
    case "en_pause":
    case "en pause":
      return "En pause";
    default:
      return s || "En cours";
  }
}

function statutColor(s?: string): string {
  switch (s) {
    case "en_cours":
    case "en cours":
      return "#0B5FFF";
    case "termine":
    case "terminé":
      return "#22C55E";
    case "en_pause":
    case "en pause":
      return "#F59E0B";
    default:
      return "#0B5FFF";
  }
}

/* ------------------------------------------------------------------ */
/* Animations                                                         */
/* ------------------------------------------------------------------ */

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/* ------------------------------------------------------------------ */
/* Composants                                                         */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[22px] border border-[#E7EBF5] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
      <div className="mb-3 size-11 rounded-[14px] bg-[#E7EBF5]" />
      <div className="mb-2 h-3 w-1/2 rounded bg-[#E7EBF5]" />
      <div className="h-6 w-2/3 rounded bg-[#E7EBF5]" />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof HardHat;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-[22px] border border-white/50 bg-white/90 p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)] backdrop-blur-sm"
    >
      <div
        className="mb-3 grid size-11 place-items-center rounded-[14px] text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        <Icon size={20} aria-hidden />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-[var(--navy)]">{value}</p>
    </motion.div>
  );
}

function SkeletonChantier() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[22px] border border-white/50 bg-white/90 shadow-[0_8px_24px_rgba(16,24,40,0.06)] backdrop-blur-sm">
      <div className="h-36 w-full bg-[#E7EBF5]" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 rounded bg-[#E7EBF5]" />
        <div className="h-3 w-1/2 rounded bg-[#E7EBF5]" />
        <div className="h-2 w-full rounded bg-[#E7EBF5]" />
        <div className="h-9 w-full rounded-[16px] bg-[#E7EBF5]" />
      </div>
    </div>
  );
}

function ChantierCard({ chantier, statut }: { chantier: Chantier; statut: string }) {
  const photo = chantier.photo || chantier.image_url;
  const nom = chantier.nom_projet || chantier.nom || "Chantier";
  const pct = Number(chantier.progression ?? chantier.progress ?? 0);

  const getStatutBadge = (s: string) => {
    switch (s) {
      case "en_attente":
        return (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black text-white bg-[#FF7A00]">
            ⏳ En attente
          </span>
        );
      case "en_cours":
        return (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black text-white bg-[#22C55E]">
            ✅ En cours
          </span>
        );
      case "termine":
        return (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black text-white bg-[#3B82F6]">
            🏁 Terminé
          </span>
        );
      default:
        return (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black text-white bg-[#0B5FFF]">
            {statutLabel(s)}
          </span>
        );
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      className="overflow-hidden rounded-[22px] border border-white/50 bg-white/90 shadow-[0_8px_24px_rgba(16,24,40,0.06)] backdrop-blur-sm"
    >
      <div className="relative h-36 w-full bg-[#E7EBF5]">
        {photo ? (
          <Image src={photo} alt={nom} fill className="object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-[#9CA3AF]">
            <HardHat size={40} />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-[var(--navy)]">{nom}</h3>
          {getStatutBadge(statut)}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--muted)]">
          <HardHat size={12} /> {chantier.type || "—"} · {chantier.localisation || "—"}
        </p>
        
        {statut === "en_cours" && (
          <div className="mt-3">
            <ProgressBar value={pct} label="Progression" />
          </div>
        )}
        
        {statut === "en_attente" && (
          <div className="mt-3 space-y-1 text-xs text-[var(--muted)]">
            <p>Plan: {chantier.plan_choisi || "—"}</p>
            {chantier.rdv_date && (
              <p className="flex items-center gap-1">
                <CalendarClock size={12} /> RDV: {formatDateFr(chantier.rdv_date)}
              </p>
            )}
          </div>
        )}
        
        {statut === "termine" && (
          <div className="mt-3 text-xs text-[var(--muted)]">
            <p className="flex items-center gap-1">
              <CalendarClock size={12} /> Fin: {formatDateFr(chantier.date_fin)}
            </p>
          </div>
        )}
        
        <div className="mt-4 flex gap-2">
          {statut === "termine" ? (
            <>
              <Link
                href={`/chantier/${chantier.id}?tab=photos`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-[linear-gradient(135deg,#3B82F6,#0D2B6B)] py-2 text-xs font-black text-white transition active:scale-95"
              >
                Voir l'album
              </Link>
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-[#0B5FFF] py-2 text-xs font-black text-white transition active:scale-95">
                Télécharger
              </button>
            </>
          ) : (
            <Link
              href={`/chantier/${chantier.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] py-2.5 text-sm font-black text-white transition active:scale-95"
            >
              Voir détails <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function DashboardClientPage() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [chantiersActifs, setChantiersActifs] = useState(0);
  const [depensesMois, setDepensesMois] = useState(0);
  const [prochainRdv, setProchainRdv] = useState<RendezVous | null>(null);
  const [notifsNonLues, setNotifsNonLues] = useState(0);
  const [mesChantiers, setMesChantiers] = useState<Chantier[]>([]);
  const [chantiersEnCours, setChantiersEnCours] = useState<Chantier[]>([]);
  const [chantiersEnAttente, setChantiersEnAttente] = useState<Chantier[]>([]);
  const [chantiersTermines, setChantiersTermines] = useState<Chantier[]>([]);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);

  const nomClient = user?.displayName || user?.email?.split("@")[0] || "Client";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const uid = user?.uid;
      const now = new Date();
      const moisCourant = now.getMonth() + 1;
      const anneeCourante = now.getFullYear();

      const [
        allChantiers,
        allPaiements,
        allRdv,
        allNotifs,
        mesChantiersData,
      ] = await Promise.all([
        rtdbGetList<Chantier>("chantiers"),
        rtdbGetList<Paiement>("paiements"),
        rtdbGetList<RendezVous>("rendez_vous"),
        rtdbGetList<NotificationItem>("notifications"),
        uid ? rtdbGetListByChild<Chantier>("chantiers", "client_id", uid) : Promise.resolve([]),
      ]);

      if (cancelled) return;

      // B - Chantiers actifs
      const actifs = allChantiers.filter(
        (c) => (c.statut || c.status) === "en_cours"
      ).length;
      setChantiersActifs(actifs);

      // B - Dépensé ce mois
      const depense = allPaiements.reduce((acc, p) => {
        const dt = p.date ? new Date(p.date) : null;
        if (dt && dt.getMonth() + 1 === moisCourant && dt.getFullYear() === anneeCourante) {
          return acc + (Number(p.montant) || 0);
        }
        if (p.mois === `${anneeCourante}-${String(moisCourant).padStart(2, "0")}`) {
          return acc + (Number(p.montant) || 0);
        }
        return acc;
      }, 0);
      setDepensesMois(depense);

      // B - Prochain RDV
      const futurs = allRdv
        .filter((r) => r.date && new Date(r.date).getTime() > now.getTime())
        .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
      setProchainRdv(futurs[0] ?? null);

      // B - Notifications non lues
      setNotifsNonLues(allNotifs.filter((n) => n.lu === false).length);

      // C - Mes chantiers - Trier par statut
      setMesChantiers(mesChantiersData);
      setChantiersEnCours(mesChantiersData.filter(c => (c.statut || c.status) === "en_cours"));
      setChantiersEnAttente(mesChantiersData.filter(c => (c.statut || c.status) === "en_attente"));
      setChantiersTermines(mesChantiersData.filter(c => (c.statut || c.status) === "termine" || (c.statut || c.status) === "terminé"));

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const actionsRapides = [
    { icon: Calculator, label: "Simulation", href: "/simulation", color: "#FF7A00" },
    { icon: BrickWall, label: "Nouveau chantier", href: "/nouveau-chantier", color: "#0B5FFF" },
    { icon: Hammer, label: "Rénovation", href: "/renovation", color: "#22C55E" },
  ];

  return (
    <div className="relative min-h-screen bg-[var(--bg-dashboard)]">
      {/* Image de fond villa */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: 'url(/images/villa-bg.jpg)' }}
      ></div>
      
      {/* Overlay blanc 70% avec effet glass */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10"></div>
      
      {/* Contenu principal */}
      <main className="relative z-20 flex flex-col gap-3 px-4 py-4 pb-28">
        {/* SECTION A - Header personnalisé - style glass morphism */}
        <header className="rounded-[22px] border border-white/50 bg-white/90 backdrop-blur-sm">
          <div className="px-4 pt-4 pb-2 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl font-black tracking-[-0.03em] text-[var(--navy)] sm:text-3xl">
                Bonjour {nomClient}
              </h1>
              <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                {formatDateFrancais(new Date())}
              </p>
            </motion.div>
            
            <div className="mt-2 flex justify-start">
              <WeatherWidget title="Météo du jour" />
            </div>
          </div>
        </header>

        {/* SECTION B - Actions rapides - 3 boutons COLLÉS */}
        <div className="mx-auto w-full max-w-3xl">
          <motion.section
            aria-label="Actions rapides"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <div className="grid grid-cols-3 gap-2">
              {actionsRapides.map((a, i) => (
                <motion.div 
                  key={a.href} 
                  variants={itemVariants} 
                  custom={i}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={a.href}
                    className="group flex h-full flex-col items-center gap-2 rounded-[16px] border border-white/50 bg-white/90 p-3 text-center shadow-[0_4px_12px_rgba(16,24,40,0.06)] backdrop-blur-sm transition-all active:scale-95 hover:shadow-[0_6px_16px_rgba(16,24,40,0.08)]"
                  >
                    <motion.div
                      className="grid size-10 place-items-center rounded-[12px] text-white shadow-md"
                      style={{ backgroundColor: a.color }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <a.icon size={18} aria-hidden />
                    </motion.div>
                    <span className="text-[10px] font-black leading-tight text-[var(--navy)] group-hover:text-[var(--primary)] transition-colors">
                      {a.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
              </div>
            </motion.section>

            {/* Super Calculateur Widget - Estimation rapide */}
            <motion.section
              aria-label="Estimation rapide"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-3"
            >
              <SuperCalculateur
                surface={150}
                chambres={3}
                sallesDeBain={2}
                etages={1}
                garage={false}
                piscine={false}
                jardin={false}
                standing="moyen"
                style="moderne"
                mode="widget"
              />
            </motion.section>

            {/* SECTION C - Résumé rapide */}
          <motion.section
            aria-label="Résumé rapide"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="mt-3"
          >
            <h2 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[var(--muted)]">
              Résumé rapide
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                <>
                  <SummaryCard icon={HardHat} label="Chantiers actifs" value={`${chantiersActifs}`} color="#0B5FFF" />
                  <SummaryCard icon={Wallet} label="Dépensé ce mois" value={formatFcfa(depensesMois)} color="#FF7A00" />
                  <SummaryCard
                    icon={CalendarClock}
                    label="Prochain RDV"
                    value={prochainRdv ? (prochainRdv.type || "Prévu") : "Aucun"}
                    color="#22C55E"
                  />
                  <SummaryCard icon={Bell} label="Notifications" value={`${notifsNonLues}`} color="#EC4899" />
                </>
              )}
            </div>
            {!loading && prochainRdv?.date && (
              <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
                📅 {formatDateFr(prochainRdv.date)}
                {prochainRdv.lieu ? ` · ${prochainRdv.lieu}` : ""}
              </p>
            )}
          </motion.section>

          {/* SECTION D - Mes chantiers */}
          <motion.section
            aria-label="Mes chantiers"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-3"
          >
            <h2 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[var(--muted)]">
              Mes chantiers
            </h2>

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <SkeletonChantier />
                <SkeletonChantier />
              </div>
            ) : mesChantiers.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-white/50 bg-white/90 p-8 text-center backdrop-blur-sm">
                <HardHat size={48} className="mx-auto mb-3 text-[#9CA3AF]" />
                <p className="text-sm font-bold text-[var(--muted)]">
                  Vous n'avez pas encore de chantier
                </p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Commencez par créer votre premier projet !
                </p>
                <Link
                  href="/nouveau-chantier"
                  className="mt-3 inline-flex items-center gap-2 rounded-[16px] bg-[var(--primary)] px-6 py-2.5 text-sm font-black text-white transition hover:bg-[var(--primary)]/80"
                >
                  <BrickWall size={18} /> Créer un chantier
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Chantiers en cours */}
                {chantiersEnCours.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-[#22C55E]">
                      <span className="text-lg">🏗️</span> Chantiers en cours
                    </h3>
                    <motion.div
                      className="grid gap-3 sm:grid-cols-2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                    >
                      {chantiersEnCours.map((c) => (
                        <ChantierCard key={c.id} chantier={c} statut="en_cours" />
                      ))}
                    </motion.div>
                  </div>
                )}

                {/* Chantiers en attente */}
                {chantiersEnAttente.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-[#FF7A00]">
                      <span className="text-lg">⏳</span> Chantiers en attente de validation
                    </h3>
                    <motion.div
                      className="grid gap-3 sm:grid-cols-2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                    >
                      {chantiersEnAttente.map((c) => (
                        <ChantierCard key={c.id} chantier={c} statut="en_attente" />
                      ))}
                    </motion.div>
                    <div className="mt-3 rounded-[16px] bg-orange-50 border border-orange-200 p-3 text-center">
                      <p className="text-xs font-semibold text-orange-700">
                        Un expert vous contactera bientôt pour confirmer votre projet
                      </p>
                    </div>
                  </div>
                )}

                {/* Chantiers terminés */}
                {chantiersTermines.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-[#3B82F6]">
                      <span className="text-lg">✅</span> Chantiers terminés
                    </h3>
                    <motion.div
                      className="grid gap-3 sm:grid-cols-2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                    >
                      {chantiersTermines.map((c) => (
                        <ChantierCard key={c.id} chantier={c} statut="termine" />
                      ))}
                    </motion.div>
                  </div>
                )}

                {/* Bouton Créer un autre chantier */}
                {mesChantiers.length > 0 && (
                  <Link
                    href="/nouveau-chantier"
                    className="flex items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-[var(--primary)] bg-white/90 py-4 text-sm font-black text-[var(--primary)] backdrop-blur-sm transition hover:bg-[var(--primary)] hover:text-white"
                  >
                    <BrickWall size={20} /> Créer un autre chantier
                  </Link>
                )}
              </div>
            )}
           </motion.section>
           
           {/* SECTION E - À propos de BÂTIZEN.CI */}
           <div className="mt-6 p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
             <h3 className="text-lg font-bold text-[var(--navy)] mb-3">🏗️ À PROPOS DE BÂTIZEN.CI</h3>
             <p className="text-sm text-gray-700 mb-3">
               BÂTIZEN.CI est votre partenaire BTP de confiance en Côte d'Ivoire. 
               Nous simplifions la construction en vous connectant avec des experts qualifiés, 
               en vous offrant des outils de simulation avancés et en assurant un suivi transparent de vos projets.
             </p>
             <p className="text-sm text-gray-700">
               Notre mission : rendre la construction accessible, transparente et professionnelle pour tous.
             </p>
           </div>

           {/* SECTION F - Alerte Arnaque */}
           <div className="mt-4 p-4 bg-red-50/80 backdrop-blur-lg rounded-2xl border border-red-200">
             <h3 className="text-lg font-bold text-red-700 mb-3">🚨 ALERTE ARNAQUE</h3>
             <p className="text-sm text-gray-800 mb-2 font-semibold">
               ⚠️ BÂTIZEN.CI ne demande JAMAIS :
             </p>
             <ul className="text-sm text-gray-700 space-y-1 mb-3">
               <li>• Votre code OTP par téléphone</li>
               <li>• Un paiement avant contrat signé</li>
               <li>• Vos mots de passe complets</li>
               <li>• Des frais cachés ou supplémentaires non annoncés</li>
             </ul>
             <p className="text-sm text-gray-700">
               📞 En cas de doute, contactez-nous : +225 07 07 07 07 07
             </p>
           </div>

           {/* SECTION G - Nos Engagements */}
           <div className="mt-4 p-4 bg-green-50/80 backdrop-blur-lg rounded-2xl border border-green-200">
             <h3 className="text-lg font-bold text-green-700 mb-3">🤝 NOS ENGAGEMENTS</h3>
             <ul className="text-sm text-gray-700 space-y-2">
               <li className="flex items-start">
                 <span className="text-green-600 mr-2">✅</span>
                 <span>Transparence totale des prix et des délais</span>
               </li>
               <li className="flex items-start">
                 <span className="text-green-600 mr-2">✅</span>
                 <span>Experts qualifiés et certifiés</span>
               </li>
               <li className="flex items-start">
                 <span className="text-green-600 mr-2">✅</span>
                 <span>Suivi en temps réel de votre projet</span>
               </li>
               <li className="flex items-start">
                 <span className="text-green-600 mr-2">✅</span>
                 <span>Garantie décennale sur tous les travaux</span>
               </li>
               <li className="flex items-start">
                 <span className="text-green-600 mr-2">✅</span>
                 <span>Support client 7j/7</span>
               </li>
             </ul>
           </div>
         </div>
       </main>
     </div>
   );
 }
