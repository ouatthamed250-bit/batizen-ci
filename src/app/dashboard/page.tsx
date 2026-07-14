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
import { rtdbGetList, rtdbGetListByChild } from "@/lib/rtdb";
import { formatFcfa } from "@/utils/currency";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type Chantier = {
  id: string;
  client_id?: string;
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
      className="rounded-[22px] border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)]"
    >
      <div
        className="mb-3 grid size-11 place-items-center rounded-[14px] text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        <Icon size={20} aria-hidden />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-[#0D2B6B]">{value}</p>
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

      // C - Mes chantiers
      setMesChantiers(mesChantiersData);

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
    <main className="min-h-screen bg-[#F7F9FC] pt-20 pb-24">
      {/* SECTION A - Header personnalisé */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/chantier-bg.jpg"
            alt=""
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D2B6B]/90 via-[#0D2B6B]/75 to-[#0D2B6B]/95" />
        </div>

        <div className="relative px-4 pt-10 pb-8 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
              Bonjour {nomClient}
            </h1>
            <p className="mt-1 text-sm font-semibold text-white/80">
              {formatDateFrancais(new Date())}
            </p>
          </motion.div>

          <div className="mt-5 flex justify-start">
            <WeatherWidget title="Météo du jour" />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 pt-6 sm:px-6">
        {/* SECTION B - Résumé rapide */}
        <motion.section
          aria-label="Résumé rapide"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <h2 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-[#6B7280]">
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
            <p className="mt-2 text-xs font-semibold text-[#6B7280]">
              📅 {formatDateFr(prochainRdv.date)}
              {prochainRdv.lieu ? ` · ${prochainRdv.lieu}` : ""}
            </p>
          )}
        </motion.section>

        {/* SECTION C - Mes chantiers en cours */}
        <motion.section
          aria-label="Mes chantiers en cours"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <h2 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-[#6B7280]">
            Mes chantiers en cours
          </h2>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <SkeletonChantier />
              <SkeletonChantier />
            </div>
          ) : mesChantiers.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#E7EBF5] bg-white p-8 text-center">
              <p className="text-sm font-bold text-[#6B7280]">
                Vous n'avez aucun chantier en cours
              </p>
            </div>
          ) : (
            <motion.div
              className="grid gap-4 sm:grid-cols-2"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {mesChantiers.map((c) => {
                const photo = c.photo || c.image_url;
                const nom = c.nom_projet || c.nom || "Chantier";
                const pct = Number(c.progression ?? c.progress ?? 0);
                return (
                  <motion.div
                    key={c.id}
                    variants={itemVariants}
                    className="overflow-hidden rounded-[22px] border border-[#E7EBF5] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.06)]"
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
                        <h3 className="font-black text-[#0D2B6B]">{nom}</h3>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                          style={{ backgroundColor: statutColor(c.statut || c.status) }}
                        >
                          {statutLabel(c.statut || c.status)}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[#6B7280]">
                        <CalendarClock size={12} /> Fin prévue : {formatDateFr(c.date_fin)}
                      </p>
                      <div className="mt-3">
                        <ProgressBar value={pct} label="Progression" />
                      </div>
                      <Link
                        href={`/chantier/${c.id}`}
                        className="mt-4 flex items-center justify-center gap-1.5 rounded-[16px] bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] py-2.5 text-sm font-black text-white transition active:scale-95"
                      >
                        Voir détails <ChevronRight size={16} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.section>

        {/* SECTION D - Actions rapides */}
        <motion.section
          aria-label="Actions rapides"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <h2 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-[#6B7280]">
            Actions rapides
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {actionsRapides.map((a, i) => (
              <motion.div key={a.href} variants={itemVariants} custom={i}>
                <Link
                  href={a.href}
                  className="flex h-full flex-col items-center gap-2.5 rounded-[20px] border border-[#E7EBF5] bg-white p-4 text-center shadow-[0_8px_24px_rgba(16,24,40,0.06)] transition active:scale-95"
                >
                  <div
                    className="grid size-12 place-items-center rounded-[16px] text-white"
                    style={{ backgroundColor: a.color }}
                  >
                    <a.icon size={22} aria-hidden />
                  </div>
                  <span className="text-[11px] font-black leading-tight text-[#0D2B6B]">
                    {a.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function SkeletonChantier() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[22px] border border-[#E7EBF5] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
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