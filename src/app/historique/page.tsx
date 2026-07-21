"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import {
  HardHat,
  CalendarClock,
  Download,
  Image as ImageIcon,
  Star,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { rtdbGetListByChild } from "@/lib/rtdb";
import { formatFcfa } from "@/utils/currency";

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

function formatDateFr(d?: string): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[22px] border border-[#E7EBF5] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
      <div className="mb-3 size-11 rounded-[14px] bg-[#E7EBF5]" />
      <div className="mb-2 h-3 w-1/2 rounded bg-[#E7EBF5]" />
      <div className="h-6 w-2/3 rounded bg-[#E7EBF5]" />
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
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  return (
    <main className="pt-20 pb-16 px-4 min-h-screen bg-[#f9fafb]">
      {/* Header */}
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
              📚 Chantiers terminés
            </h1>
            <p className="mt-1 text-sm font-semibold text-white/80">
              Retrouvez tous vos projets achevés
            </p>
          </motion.div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pt-6 sm:px-6">
        {loading ? (
          <motion.div
            className="grid gap-4 sm:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <SkeletonCard />
            <SkeletonCard />
          </motion.div>
        ) : chantiersTermines.length === 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="rounded-[22px] border border-dashed border-[#E7EBF5] bg-white p-8 text-center"
          >
            <HardHat size={48} className="mx-auto mb-3 text-[#9CA3AF]" />
            <p className="text-sm font-bold text-[#6B7280]">
              Vous n'avez pas encore de chantier terminé
            </p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Vos chantiers terminés apparaîtront ici
            </p>
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
                  className="overflow-hidden rounded-[22px] border border-[#E7EBF5] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.06)] backdrop-blur-sm"
                >
                  <div className="relative h-36 w-full bg-[#E7EBF5]">
                    {photo ? (
                      <Image src={photo} alt={nom} fill className="object-cover" />
                    ) : (
                      <div className="grid size-full place-items-center text-[#9CA3AF]">
                        <HardHat size={40} />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 rounded-full bg-[#3B82F6] px-2 py-0.5 text-[10px] font-black text-white">
                      🏁 Terminé
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-black text-[#0D2B6B]">{nom}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[#6B7280]">
                      <HardHat size={12} /> {c.type || "—"} · {c.localisation || "—"}
                    </p>
                    <div className="mt-3 space-y-1 text-xs text-[#6B7280]">
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
                        className="flex items-center justify-center gap-1.5 rounded-[16px] bg-[linear-gradient(135deg,#3B82F6,#0D2B6B)] py-2 text-xs font-black text-white transition active:scale-95"
                      >
                        <ImageIcon size={14} /> Album
                      </Link>
                      <button className="flex items-center justify-center gap-1.5 rounded-[16px] bg-[#0B5FFF] py-2 text-xs font-black text-white transition active:scale-95">
                        <Download size={14} /> Passeport
                      </button>
                    </div>
                    <Link
                      href={`/chantier/${c.id}`}
                      className="mt-2 flex items-center justify-center gap-1.5 rounded-[16px] border border-[#E7EBF5] py-2 text-xs font-black text-[#0D2B6B] transition hover:bg-[#E7EBF5] active:scale-95"
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
    </main>
  );
}

