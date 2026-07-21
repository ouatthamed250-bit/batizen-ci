"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  HardHat,
  CalendarClock,
  Download,
  Star,
  FileText,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { rtdbGetListByChild } from "@/lib/rtdb";
import { formatFcfa } from "@/utils/currency";
import BtpBackground from "@/components/btp/BtpBackground";

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
  type?: string;
  localisation?: string;
  date_fin?: string;
  date_debut?: string;
  budget?: number;
};

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function formatDateFr(d?: string): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[22px] border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-xl">
      <div className="mb-3 size-11 rounded-[14px] bg-white/20" />
      <div className="mb-2 h-3 w-1/2 rounded bg-white/20" />
      <div className="h-6 w-2/3 rounded bg-white/20" />
    </div>
  );
}

export default function HistoriquePage() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [chantiersTermines, setChantiersTermines] = useState<Chantier[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const uid = user?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }

      const mesChantiers = await rtdbGetListByChild<Chantier>("chantiers", "client_id", uid);
      if (cancelled) return;

      const termines = mesChantiers.filter(
        (c) => (c.statut || c.status) === "termine" || (c.statut || c.status) === "terminé"
      );

      setChantiersTermines(termines);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const pageContent = (
    <div className="min-h-screen pt-24 pb-24 px-2">
      {/* Header */}
      <div className="mb-8 mx-2">
        <h1 className="text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">
          📚 Chantiers terminés
        </h1>
        <p className="mt-1 text-sm font-semibold text-blue-100">
          Retrouvez tous vos projets achevés
        </p>
      </div>

      <div className="mx-2 space-y-4">
        {loading ? (
          <motion.div
            className="grid gap-4 sm:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <SkeletonCard /><SkeletonCard />
          </motion.div>
        ) : chantiersTermines.length === 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="rounded-[22px] border border-dashed border-white/20 bg-white/10 p-8 text-center backdrop-blur-xl"
          >
            <HardHat size={48} className="mx-auto mb-3 text-blue-200" />
            <p className="text-sm font-bold text-white">Vous n'avez pas encore de chantier terminé</p>
            <p className="mt-1 text-xs text-blue-100">Vos chantiers terminés apparaîtront ici</p>
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {chantiersTermines.map((c) => {
              const photo = c.photo || c.image_url;
              const nom = c.nom_projet || c.nom || "Chantier";
              return (
                <motion.div
                  key={c.id}
                  variants={itemVariants}
                  className="overflow-hidden rounded-[22px] border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-xl"
                >
                  <div className="relative h-36 w-full rounded-[16px] bg-white/5 overflow-hidden mb-4">
                    {photo ? (
                      <img src={photo} alt={nom} className="w-full h-full object-cover" />
                    ) : (
                      <div className="grid size-full place-items-center text-blue-200">
                        <HardHat size={40} />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 rounded-full bg-green-500/30 px-2 py-0.5 text-[10px] font-black text-white">
                      🏁 Terminé
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-black text-white">{nom}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-blue-200">
                      <HardHat size={12} /> {c.type || "—"} · {c.localisation || "—"}
                    </p>
                    <div className="mt-3 space-y-1 text-xs text-blue-200">
                      <p className="flex items-center gap-1">
                        <CalendarClock size={12} /> Début: {formatDateFr(c.date_debut)}
                      </p>
                      <p className="flex items-center gap-1">
                        <CalendarClock size={12} /> Fin: {formatDateFr(c.date_fin)}
                      </p>
                      {c.budget && (
                        <p className="flex items-center gap-1">
                          <FileText size={12} /> Budget: {formatFcfa(c.budget)}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        href={`/chantier/${c.id}?tab=photos`}
                        className="flex items-center justify-center gap-1.5 rounded-[16px] bg-gradient-to-r from-[#0B5FFF] to-[#0D2B6B] py-2 text-xs font-black text-white transition active:scale-95"
                      >
                        📷 Album
                      </Link>
                      <button className="flex items-center justify-center gap-1.5 rounded-[16px] bg-white/20 py-2 text-xs font-black text-white transition active:scale-95">
                        📄 Passeport
                      </button>
                    </div>
                    <Link
                      href={`/chantier/${c.id}`}
                      className="mt-2 flex items-center justify-center gap-1.5 rounded-[16px] border border-white/20 py-2 text-xs font-black text-blue-200 transition hover:bg-white/20 active:scale-95"
                    >
                      Laisser un avis <Star size={14} className="text-[#FF7A00]" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <BtpBackground imageUrl="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop" overlay="medium">
      {pageContent}
    </BtpBackground>
  );
}