"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { HardHat, BrickWall, ChevronRight, Bell, Wallet, CalendarClock, Megaphone, Plus, FolderKanban, MessageCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useChantiers } from "@/hooks/useChantiers";
import { WeatherWidget } from "@/components/btp/WeatherWidget";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { logger } from "@/utils/logger";
import dynamic from "next/dynamic";
import type { Chantier } from "@/types/chantier";
import { formatDateCourte, formatLocalisation, formatFcfa, getStatutLabel } from "@/utils/formatters";
import { useRouter } from "next/navigation";

const ChatBot = dynamic(() => import("@/components/ChatBot"), { ssr: false });

/* ------------------------------------------------------------------ */
/* Constantes                                                          */
/* ------------------------------------------------------------------ */
const ANNONCES_DEMO = [
  "🎉 Promo: -10% sur votre premier chantier ce mois-ci !",
  "📢 Nouveau: Suivi de chantier par drone disponible.",
  "🔥 Offre spéciale: Audit gratuit pour les rénovations.",
  "⚠️ Rappel: Pensez à valider vos devis en attente."
];

/* ------------------------------------------------------------------ */
/* Composants Internes                                                 */
/* ------------------------------------------------------------------ */

function SummaryCard({ icon: Icon, label, value }: { 
  icon: typeof HardHat; 
  label: string; 
  value: string | number; 
}) {
  return (
    <div className="w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 flex flex-col items-center text-center gap-3 shadow-xl">
      <div className="grid size-14 place-items-center rounded-[20px] text-white bg-gradient-to-br from-[#1E1E2E] to-[#111827] shadow-lg">
        <Icon size={26} />
      </div>
      <div className="w-full">
        <p className="text-[10px] font-bold dark:text-white/80 text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-base font-black dark:text-white text-gray-900 drop-shadow-md break-words">{value}</p>
      </div>
    </div>
  );
}

function SkeletonChantier() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl w-full shadow-xl">
      <div className="h-40 w-full bg-white/10" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 rounded bg-white/20" />
        <div className="h-4 w-1/2 rounded bg-white/20" />
        <div className="h-10 w-full rounded-[20px] bg-white/20" />
      </div>
    </div>
  );
}

function ChantierCard({ chantier, onModifier, onSupprimer }: { 
  chantier: Chantier; 
  onModifier?: (id: string) => void;
  onSupprimer?: (id: string, statut: string) => void;
}) {
  const photo = (chantier as any).photo || (chantier as any).image_url;
  const nom = chantier.nom_projet || chantier.nom || "Chantier";
  const pct = Number((chantier as any).progression ?? (chantier as any).progress ?? 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full overflow-hidden rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl shadow-xl"
    >
      <div className="relative h-32 w-full bg-white/10">
        {photo ? <Image src={photo} alt={nom} fill className="object-cover" /> : <div className="grid size-full place-items-center text-white/60"><HardHat size={48} /></div>}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black dark:text-white text-gray-900 drop-shadow-md break-words text-lg">{nom}</h3>
          <span className="shrink-0 rounded-full px-3 py-1 text-[10px] font-black text-white bg-[#0B5FFF] shadow-md whitespace-nowrap">
            {getStatutLabel(chantier.statut)}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm dark:text-white/80 text-gray-600 drop-shadow-md">
          <HardHat size={14} /> {chantier.type || "—"} · {formatLocalisation(chantier.localisation)}
        </p>
        <p className="mt-2 text-sm dark:text-white/80 text-gray-600 drop-shadow-md">
          💰 Budget : <span className="font-bold dark:text-white text-gray-900">{formatFcfa(chantier.budget || 0)}</span>
        </p>
        
        {(chantier.statut === "en_cours") && (
          <div className="mt-4">
            <ProgressBar value={pct} label="Progression" />
          </div>
        )}
        
        <div className="mt-5 flex flex-col gap-3">
          <Link href={`/chantier/${chantier.id}`} className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#1E1E2E] to-[#111827] py-3.5 text-sm font-black text-white transition active:scale-95 shadow-lg">
            Voir détails <ChevronRight size={18} />
          </Link>
          
          {(chantier.statut === "en_attente" || chantier.statut === "en_attente_rdv") && onModifier && onSupprimer && (
            <div className="flex gap-3">
              <button
                onClick={() => onModifier(chantier.id)}
                className="flex-1 rounded-[16px] bg-white/20 py-3 text-sm font-bold text-white transition active:scale-95 shadow-lg"
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => onSupprimer(chantier.id, chantier.statut!)}
                className="flex-1 rounded-[16px] bg-red-500/30 py-3 text-sm font-bold text-white transition active:scale-95 shadow-lg"
              >
                🗑️ Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Page Principale — Dashboard Client                                  */
/* ------------------------------------------------------------------ */

export default function DashboardClientPage() {
  const { user } = useAuthContext();
  const { getChantiersByClient, loading: loadingChantiers } = useChantiers();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadChantiers = async () => {
      const mesChantiers = await getChantiersByClient(user.uid);
      setChantiers(mesChantiers);
      setLoading(false);
    };

    loadChantiers();
  }, [user, getChantiersByClient]);

  const userName = user?.displayName || user?.email?.split("@")[0] || "Client";
  const chantiersActifs = chantiers.filter(c => c.statut === "en_cours").length;
  const chantiersEnAttente = chantiers.filter(c => c.statut === "en_attente" || c.statut === "en_attente_rdv").length;
  const chantiersTermines = chantiers.filter(c => c.statut === "termine" || c.statut === "terminé").length;
  
  const prochainRdv = chantiers
    .filter(c => (c.statut === "en_attente" || c.statut === "en_attente_rdv") && (c as any).rdv_date)
    .sort((a, b) => new Date((a as any).rdv_date!).getTime() - new Date((b as any).rdv_date!).getTime())[0];

  const handleSupprimerChantier = async (id: string, statut: string) => {
    if (statut === "en_cours" || statut === "termine" || statut === "terminé") {
      alert("⚠️ Impossible de supprimer un chantier en cours ou terminé.");
      return;
    }
    if (!confirm("Voulez-vous vraiment supprimer ce chantier ? Cette action est irréversible.")) return;
    
    const { default: { getDatabase, ref, update } } = await import("firebase/database");
    const db = getDatabase();
    await update(ref(db, `chantiers/${id}`), { 
      statut: "supprime_par_client", 
      dateMiseAJour: Date.now() 
    });
    alert("✅ Chantier supprimé.");
  };

  const handleModifierChantier = (id: string) => {
    router.push(`/nouveau-chantier?edit=${id}`);
  };

  return (
    <>
      <style>{`
        .wave-hand { display: inline-block; transform-origin: 70% 70%; animation: wave 2.5s infinite; }
        @keyframes wave { 0% { transform: rotate(0deg); } 10% { transform: rotate(14deg); } 20% { transform: rotate(-8deg); } 30% { transform: rotate(14deg); } 40% { transform: rotate(-4deg); } 50% { transform: rotate(10deg); } 60% { transform: rotate(0deg); } 100% { transform: rotate(0deg); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
      `}</style>
      
      <div className="flex flex-col gap-5 pt-6 pb-4">
        {/* Salutation */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl wave-hand" role="img" aria-label="Salutation">✋🏽</span>
          <div>
            <h1 className="text-2xl font-black dark:text-white text-gray-900 leading-tight drop-shadow-lg">
              Bonjour, <span className="text-[#FF7A00] drop-shadow-md">{userName}</span>
            </h1>
            <p className="text-sm dark:text-white/80 text-gray-600 font-medium mt-1 drop-shadow-md">
              Prêt à suivre vos chantiers aujourd'hui ?
            </p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <Link href="/nouveau-chantier"
            className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-[#FF7A00] to-[#FF9A30] text-white rounded-[22px] shadow-lg transition active:scale-95 font-bold"
          >
            <Plus size={20} /> Nouveau chantier
          </Link>
          <Link href="/projets"
            className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white rounded-[22px] shadow-lg transition active:scale-95 font-bold"
          >
            <FolderKanban size={20} /> Mes projets
          </Link>
        </div>

        {/* Bande défilante */}
        <div className="w-full overflow-hidden bg-[#FF7A00]/10 backdrop-blur-md rounded-[24px] border border-[#FF7A00]/30 py-3 shadow-lg">
          <div className="flex animate-marquee whitespace-nowrap gap-12 px-3">
            {[...ANNONCES_DEMO, ...ANNONCES_DEMO].map((annonce, i) => (
              <span key={i} className="text-sm font-bold text-[#FF7A00] drop-shadow-md flex items-center gap-2">
                <Megaphone size={14} /> {annonce}
              </span>
            ))}
          </div>
        </div>

        {/* Cartes Résumé */}
        {!loading && (
          <section className="grid grid-cols-2 gap-3 w-full">
            <SummaryCard icon={HardHat} label="En cours" value={chantiersActifs} />
            <SummaryCard icon={CalendarClock} label="En attente" value={chantiersEnAttente} />
            <SummaryCard icon={FolderKanban} label="Terminés" value={chantiersTermines} />
            <SummaryCard icon={CalendarClock} label="Prochain RDV" value={prochainRdv ? formatDateCourte((prochainRdv as any).rdv_date) : "Aucun"} />
          </section>
        )}

        {/* Météo */}
        <div className="w-full rounded-[32px] p-6 md:p-8 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] text-white shadow-xl">
          <WeatherWidget title="Météo du jour" />
        </div>

        {/* Liste des chantiers */}
        {loading ? (
          <div className="space-y-4 w-full">
            <SkeletonChantier /><SkeletonChantier />
          </div>
        ) : chantiers.length === 0 ? (
          <div className="w-full rounded-[28px] border border-dashed border-white/30 bg-white/20 p-8 text-center backdrop-blur-xl shadow-xl">
            <HardHat size={56} className="mx-auto mb-4 dark:text-white/60 text-gray-400" />
            <p className="text-base font-bold dark:text-white/80 text-gray-700 drop-shadow-md mb-4">
              Vous n'avez pas encore de chantier.
            </p>
            <Link href="/nouveau-chantier" className="inline-flex items-center gap-2 rounded-[20px] bg-[#1E1E2E] px-8 py-3 text-sm font-black text-white shadow-lg transition active:scale-95">
              <BrickWall size={20} /> Créer un chantier
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-black dark:text-white text-gray-900 mb-4 flex items-center gap-2">
              🏗️ Mes chantiers ({chantiers.length})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {chantiers.map((c) => (
                <ChantierCard key={c.id} chantier={c} onModifier={handleModifierChantier} onSupprimer={handleSupprimerChantier} />
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <ChatBot />
        </div>
      </div>
    </>
  );
}